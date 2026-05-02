import { beforeEach } from 'vitest';

import { resetSingletons } from '../db/reset-singletons';
import { resetTestDb } from '../db/reset-test-db';

export const setupScenario = (): void => {
    beforeEach(() => {
        resetTestDb();
        resetSingletons();
    });
};
