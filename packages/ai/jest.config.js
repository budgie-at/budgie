module.exports = {
    coverageReporters: ['text-summary', 'lcov'],
    reporters: ['default'],
    coveragePathIgnorePatterns: ['.mock.ts'],
    displayName: 'ai',
    testRegex: './src/.*\\.spec\\.(ts?)$',
    testEnvironment: 'node',
    coverageThreshold: {
        global: {
            statements: 0,
            branches: 0,
            lines: 0,
            functions: 0
        }
    }
};
