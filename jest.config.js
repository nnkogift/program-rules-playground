module.exports = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '\\.(css|less)$': '<rootDir>/jest.css.mock.js',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // usehooks-ts ships ESM-only; transform it instead of leaving it in the
    // default node_modules ignore list. pnpm nests it under
    // node_modules/.pnpm/usehooks-ts@.../node_modules/usehooks-ts, so the
    // lookahead has to check for the package name anywhere in the rest of
    // the path, not just immediately after the last node_modules/ segment.
    transformIgnorePatterns: ['/node_modules/(?!.*usehooks-ts)'],
}
