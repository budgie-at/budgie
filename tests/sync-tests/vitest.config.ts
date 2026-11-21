import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';
import { configDefaults, defineConfig } from 'vitest/config';

const config = createTestVitestConfig(__dirname, 'src/harness/scenario/setup.ts');
const binanceScenarios = 'src/scenarios/binance/**/*.test.ts';

export default defineConfig({
    test: {
        projects: [
            {
                ...config,
                root: __dirname,
                test: { ...config.test, name: 'scenarios', exclude: [...configDefaults.exclude, binanceScenarios] }
            },
            { ...config, root: __dirname, test: { ...config.test, name: 'binance', include: [binanceScenarios], isolate: true } }
        ]
    }
});
