import { buildTestDb } from '@budgie-at/test-kit';

import { isNotEmptyString } from '@rnw-community/shared';

export const backupDatabasePath = isNotEmptyString(process.env['BUDGIE_BACKUP_DB']) ? process.env['BUDGIE_BACKUP_DB'] : null;

export const testDb = await buildTestDb(backupDatabasePath);
