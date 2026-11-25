import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig } from 'vitest/config';

const APP_TIMEZONE = 'America/New_York' as const;
const TEST_DIRECTORY = 'test' as const;
const TEST_ENVIRONMENT = 'node' as const;
const TEST_ENV = { TZ: APP_TIMEZONE };
const MAX_WORKERS = 4;
const allTestFiles = readdirSync(join(__dirname, TEST_DIRECTORY), { recursive: true, encoding: 'utf8' })
    .filter(entry => entry.endsWith('.test.ts'))
    .map(entry => `${TEST_DIRECTORY}/${entry}`);
const isolatedTestFiles = allTestFiles.filter(filePath => readFileSync(join(__dirname, filePath), 'utf8').includes('vi.mock('));
const fastTestFiles = allTestFiles.filter(filePath => !isolatedTestFiles.includes(filePath));

export default defineConfig({
    test: {
        maxWorkers: MAX_WORKERS,
        projects: [
            {
                test: {
                    name: 'isolated',
                    environment: TEST_ENVIRONMENT,
                    env: TEST_ENV,
                    maxWorkers: MAX_WORKERS,
                    isolate: true,
                    include: isolatedTestFiles
                }
            },
            {
                test: {
                    name: 'fast',
                    environment: TEST_ENVIRONMENT,
                    env: TEST_ENV,
                    maxWorkers: MAX_WORKERS,
                    isolate: false,
                    include: fastTestFiles
                }
            }
        ]
    }
});
