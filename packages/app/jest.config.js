module.exports = {
    coverageReporters: ['text-summary', 'lcov'],
    reporters: ['default'],
    coveragePathIgnorePatterns: ['.mock.ts'],
    displayName: 'app',
    testRegex: './src/.*\\.spec\\.(ts?)$',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
        '^expo-sqlite/(.*)$': '<rootDir>/__mocks__/expo-sqlite.js'
    },
    coverageThreshold: {
        global: {
            statements: 0,
            branches: 0,
            lines: 0,
            functions: 0
        }
    }
};
