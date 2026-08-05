import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// This script is run by `changesets/action` as the `publish` command,
// unconditionally on every push where there are no pending changesets (not
// just after a fresh version bump). This app is never published to npm, so
// instead of running `npm publish` it just builds the app bundle. The
// action only *pushes* a tag it expects to already exist locally (that's
// what `npm publish`/`changeset publish` normally create) and detects
// success by grepping stdout for the `New tag:` line, so we have to create
// the tag ourselves before printing it, and skip doing so (and printing
// the marker) when that tag already exists — otherwise every unrelated
// push to the release branch re-tags the same version and fails:
// https://github.com/changesets/action/blob/v1.9.0/src/run.ts
const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))
const tag = `v${version}`

const tagExists = (() => {
    try {
        execSync(`git rev-parse -q --verify refs/tags/${tag}`, {
            stdio: 'ignore',
        })
        return true
    } catch {
        return false
    }
})()

if (tagExists) {
    console.log(`${tag} already exists, nothing to release.`)
    process.exit(0)
}

execSync('pnpm build', { stdio: 'inherit' })
execSync(`git tag ${tag}`, { stdio: 'inherit' })
console.log(`New tag: ${tag}`)
