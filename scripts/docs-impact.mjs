import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Run by the `docs-impact` job in release.yml after a release is published.
// It tells the docs repo what changed:
//
// 1. Collects the `docs:` notes of the changesets in this release. In pre
//    mode Changesets keeps the changeset files, outside it deletes them, so
//    neither is reliable. The changelog generator (`@changesets/cli/changelog`)
//    copies every changeset body into CHANGELOG.md, indenting the lines after
//    the summary under the bullet, so we read them from this version's
//    CHANGELOG section instead: any line whose trimmed text starts with
//    `docs:`. The summary line itself is prefixed with `- <commit>: ` and
//    never matches.
// 2. Compares minDHIS2Version/maxDHIS2Version in d2.config.js with the
//    previous release tag, for the compatibility page.
// 3. Opens a "Docs impact" issue in the docs repo when either found
//    something (once per version), and fires `app-released` (always) and
//    `app-compat-changed` (when the range changed) repository dispatches so
//    the docs screenshot pipeline can run.
//
// Needs DOCS_REPO_TOKEN (fine-grained PAT, issues:write and contents:read on
// the docs repo). Without it the script warns and exits 0, so a missing
// secret never fails a release. Pass --dry-run to print instead of calling gh.

const APP_REPO = 'nnkogift/program-rules-playground'
const DOCS_REPO = 'nnkogift/program-rules-playground-docs'
const DOCS_NOTE = /^docs:\s*(.+)$/i
const VERSION_HEADING = /^## /

/** The lines of CHANGELOG.md under `## <version>`, up to the next version. */
export function changelogSection(changelog, version) {
    const lines = changelog.split('\n')
    const start = lines.findIndex((line) => line.trim() === `## ${version}`)
    if (start === -1) {
        return []
    }
    const rest = lines.slice(start + 1)
    const end = rest.findIndex((line) => VERSION_HEADING.test(line))
    return end === -1 ? rest : rest.slice(0, end)
}

/** The `docs:` notes in a changelog section, without the prefix. */
export function collectDocsNotes(sectionLines) {
    return sectionLines
        .map((line) => DOCS_NOTE.exec(line.trim())?.[1]?.trim())
        .filter(Boolean)
}

/** Reads a `key: '<value>'` string from d2.config.js source. */
export function readConfigValue(source, key) {
    const match = new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`).exec(source)
    return match?.[1]
}

export function readVersionRange(source) {
    return {
        min: readConfigValue(source, 'minDHIS2Version'),
        max: readConfigValue(source, 'maxDHIS2Version'),
    }
}

export function buildIssueBody({ version, notes, compat }) {
    const releaseUrl = `https://github.com/${APP_REPO}/releases/tag/v${version}`
    const parts = [
        `[program-rules-playground v${version}](${releaseUrl}) was released. Update the docs for the changes below.`,
    ]
    if (notes.length > 0) {
        parts.push(
            '## Docs notes from the changesets',
            notes.map((note) => `- [ ] ${note}`).join('\n')
        )
    }
    if (compat) {
        parts.push(
            '## DHIS2 version range changed',
            `- [ ] Update the DHIS2 version compatibility page: ${compat.before.min} to ${compat.before.max} is now ${compat.after.min} to ${compat.after.max}.`
        )
    }
    parts.push(
        '_Opened by the release workflow of the app repo. The screenshot pipeline was triggered with `app-released`._'
    )
    return parts.join('\n\n')
}

function git(...args) {
    return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function previousTag(tag) {
    try {
        return git(
            'describe',
            '--tags',
            '--abbrev=0',
            '--match',
            'v*',
            `${tag}^`
        )
    } catch {
        return undefined
    }
}

function compatChange(tag) {
    const before = previousTag(tag)
    if (!before) {
        return undefined
    }
    const range = {
        before: readVersionRange(git('show', `${before}:d2.config.js`)),
        after: readVersionRange(readFileSync('./d2.config.js', 'utf8')),
    }
    const changed =
        range.before.min !== range.after.min ||
        range.before.max !== range.after.max
    return changed ? range : undefined
}

function createGh({ token, dryRun }) {
    return (...args) => {
        if (dryRun) {
            console.log(`[dry run] gh ${args.join(' ')}`)
            return '[]'
        }
        return execFileSync('gh', args, {
            encoding: 'utf8',
            env: { ...process.env, GH_TOKEN: token },
        }).trim()
    }
}

function dispatch(gh, eventType, payload) {
    const fields = Object.entries(payload).flatMap(([key, value]) => [
        '-f',
        `client_payload[${key}]=${value}`,
    ])
    gh(
        'api',
        `repos/${DOCS_REPO}/dispatches`,
        '-f',
        `event_type=${eventType}`,
        ...fields
    )
    console.log(`Sent ${eventType} to ${DOCS_REPO}.`)
}

function openIssue(gh, { version, notes, compat }) {
    const title = `Docs impact: program-rules-playground v${version}`
    const existing = JSON.parse(
        gh(
            'issue',
            'list',
            '--repo',
            DOCS_REPO,
            '--state',
            'all',
            '--search',
            `"${title}" in:title`,
            '--json',
            'number'
        ) || '[]'
    )
    if (existing.length > 0) {
        console.log(`${title} already exists (#${existing[0].number}).`)
        return
    }
    gh(
        'issue',
        'create',
        '--repo',
        DOCS_REPO,
        '--title',
        title,
        '--body',
        buildIssueBody({ version, notes, compat })
    )
    console.log(`Opened "${title}" in ${DOCS_REPO}.`)
}

function main() {
    const dryRun = process.argv.includes('--dry-run')
    const token = process.env.DOCS_REPO_TOKEN
    if (!token && !dryRun) {
        console.log(
            '::warning title=Docs impact skipped::DOCS_REPO_TOKEN is not set, so no docs issue was opened and the screenshot pipeline was not triggered.'
        )
        return
    }

    const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))
    const notes = collectDocsNotes(
        changelogSection(readFileSync('./CHANGELOG.md', 'utf8'), version)
    )
    const compat = compatChange(`v${version}`)
    const gh = createGh({ token, dryRun })

    console.log(`v${version}: ${notes.length} docs note(s).`)
    dispatch(gh, 'app-released', { version })
    if (compat) {
        dispatch(gh, 'app-compat-changed', {
            version,
            minDHIS2Version: compat.after.min,
            maxDHIS2Version: compat.after.max,
        })
    }
    if (notes.length > 0 || compat) {
        openIssue(gh, { version, notes, compat })
    } else {
        console.log(
            'No docs notes and no version range change, no issue opened.'
        )
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    main()
}
