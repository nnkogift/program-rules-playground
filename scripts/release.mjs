import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// This script is run by `changesets/action` as the `publish` command. This
// app is never published to npm, so instead of running `npm publish` it just
// builds the app bundle. The action only *pushes* a tag it expects to
// already exist locally (that's what `npm publish`/`changeset publish`
// normally create) and detects success by grepping stdout for the
// `New tag:` line, so we have to create the tag ourselves before printing
// it: https://github.com/changesets/action/blob/v1.9.0/src/run.ts
execSync('pnpm build', { stdio: 'inherit' })

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))
const tag = `v${version}`
execSync(`git tag ${tag}`, { stdio: 'inherit' })
console.log(`New tag: ${tag}`)
