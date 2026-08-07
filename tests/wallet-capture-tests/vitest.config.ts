import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';
import { defineConfig } from 'vitest/config';

const config = createTestVitestConfig(__dirname, 'src/harness/scenario/setup.ts', true);

export default defineConfig({
    ...config,
    test: {
        ...config.test,
        passWithNoTests: true
    }
});
