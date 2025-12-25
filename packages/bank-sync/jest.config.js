/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.spec.ts'],
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.tsx?$': ['babel-jest', { presets: ['@babel/preset-typescript'] }]
    },
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/index.ts']
};

