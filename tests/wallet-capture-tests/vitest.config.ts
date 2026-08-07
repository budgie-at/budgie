import { defineConfig } from 'vitest/config';

import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';

const config = createTestVitestConfig(__dirname, 'src/harness/scenario/setup.ts', true);

export default defineConfig({
    ...config,
    test: {
        ...config.test,
        passWithNoTests: true
    }
});
