import { beforeEach } from 'vitest';

import { resetSingletons } from './reset-singletons';
import { resetTestDb } from './reset-test-db';

export const setupScenario = (): void => {
    beforeEach(() => {
        resetTestDb();
        resetSingletons();
    });
};
