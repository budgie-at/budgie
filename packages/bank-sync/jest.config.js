module.exports = {
    coverageReporters: ['text-summary', 'lcov'],
    reporters: ['default'],
    coveragePathIgnorePatterns: ['.mock.ts'],
    displayName: 'banc-sync',
    testRegex: './src/.*\\.spec\\.(ts?)$',
    testEnvironment: 'node',
    coverageThreshold: {
        global: {
            statements: 69,
            branches: 39,
            lines: 66,
            functions: 56
        }
    }
};
