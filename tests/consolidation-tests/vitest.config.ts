import { defineConfig } from 'vitest/config';

import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';

export default defineConfig(createTestVitestConfig(__dirname, 'src/harness/setup.ts', true));
