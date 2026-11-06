import { resetTestDb } from '@budgie-at/test-kit';
import * as Effect from 'effect/Effect';
import { beforeEach } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { backupDatabasePath, testDb } from './test-context';

beforeEach(() => (isDefined(backupDatabasePath) ? undefined : Effect.runPromise(resetTestDb(testDb))));
