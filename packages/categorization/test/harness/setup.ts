import { resetTestDb } from '@budgie-at/test-kit';
import { beforeEach } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { backupDatabasePath, testDb } from './test-context';

beforeEach(() => {
    if (!isDefined(backupDatabasePath)) {
        resetTestDb(testDb);
    }
});
