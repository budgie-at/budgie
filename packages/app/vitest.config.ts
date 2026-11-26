import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig } from 'vitest/config';

const testFiles = readdirSync(join(__dirname, 'test'), { recursive: true, encoding: 'utf8' })
    .filter(entry => entry.endsWith('.test.ts'))
    .map(entry => `test/${entry}`);
const usesModuleMocks = (filePath: string) => readFileSync(join(__dirname, filePath), 'utf8').includes('vi.mock(');
const sharedTestOptions = { environment: 'node', env: { TZ: 'America/New_York' } };

export default defineConfig({
    test: {
        maxWorkers: 4,
        projects: [
            { test: { ...sharedTestOptions, name: 'isolated', isolate: true, include: testFiles.filter(usesModuleMocks) } },
            {
                test: {
                    ...sharedTestOptions,
                    name: 'fast',
                    isolate: false,
                    include: testFiles.filter(filePath => !usesModuleMocks(filePath))
                }
            }
        ]
    }
});
