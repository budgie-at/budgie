import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transformIgnorePatterns: [],
    globals: {
        'ts-jest': {
            useESM: true,
            tsconfig: 'tsconfig.json'
        }
    },
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    moduleNameMapper: {
        // Sync with tsconfig "paths" if you use them
        // '^@/(.*)$': '<rootDir>/src/$1',
    }
};

export default config;
