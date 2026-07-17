import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig(createTestVitestConfig(__dirname, 'src/harness/setup.ts', true));
