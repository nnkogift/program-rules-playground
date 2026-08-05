import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// This script is run by `changesets/action` as the `publish` command. This
// app is never published to npm, so instead of running `npm publish` it just
// builds the app bundle and prints the marker line the action greps for on
// stdout to decide a "publish" happened and it should tag + create a GitHub
// release: https://github.com/changesets/action/blob/v1.9.0/src/run.ts
execSync('pnpm build', { stdio: 'inherit' })

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))
console.log(`New tag: v${version}`)
