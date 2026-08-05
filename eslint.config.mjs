import config from '@dhis2/config-eslint'
import { defineConfig } from 'eslint/config'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default defineConfig([
    includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
    {
        extends: [config],
    },
    {
        rules: {
            // eslint-plugin-import/order crashes on ESLint 10 for @dhis2 imports
            'import/order': 'off',
            // eslint-plugin-import can't statically resolve @dhis2/ui's dynamic
            // `Object.keys(...).forEach` re-export of @dhis2/ui-icons — TypeScript
            // resolves these correctly (see tsc), this is a resolver limitation only.
            'import/named': 'off',
        },
    },
])
