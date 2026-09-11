module.exports = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '\\.(css|less)$': '<rootDir>/jest.css.mock.js',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // usehooks-ts and lodash-es both ship ESM-only; transform them instead of
    // leaving them in the default node_modules ignore list. pnpm nests them
    // under node_modules/.pnpm/<pkg>@.../node_modules/<pkg>, so the
    // lookahead has to check for the package name anywhere in the rest of
    // the path, not just immediately after the last node_modules/ segment.
    transformIgnorePatterns: ['/node_modules/(?!.*(usehooks-ts|lodash-es))'],
}
