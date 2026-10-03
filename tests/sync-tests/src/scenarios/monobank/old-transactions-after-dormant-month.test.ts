import { SyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    buildMonobank,
    fetchPersistedMonobankTransactions,
    fetchSyncById,
    monobankStub,
    MonobankSyncService,
    setupBackwardSweepFixture,
    TestLayer
} from '../../harness';

import type { StatementItem } from '@liaugust/monobank-sdk';

const SECONDS_PER_DAY = 86_400;
const MS_PER_SECOND = 1_000;
const OLD_TRANSACTION_AGE_DAYS = 80;
const OLD_TRANSACTION_AMOUNT_KOPECKS = -1234;
const EXPECTED_PERSISTED_COUNT = 1;

describe('monobank/old-transactions-after-dormant-month', () => {
    it.effect('surfaces an old transaction sitting beyond two empty 31-day windows, then terminates at the dormancy boundary', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart);

            const oldTransactionTimeSeconds = Math.floor(sweepStart.getTime() / MS_PER_SECOND) - OLD_TRANSACTION_AGE_DAYS * SECONDS_PER_DAY;
            const oldTransaction: StatementItem = buildMonobank.transaction({
                id: 'tx-old-80d',
                amount: OLD_TRANSACTION_AMOUNT_KOPECKS,
                hold: false,
                time: oldTransactionTimeSeconds
            });

            monobankStub.statementBatches([[], [], [oldTransaction], [], [], []]);

            yield* monobankSyncService.sync();

            const persisted = yield* fetchPersistedMonobankTransactions();
            expect(persisted).toHaveLength(EXPECTED_PERSISTED_COUNT);
            const [persistedOld] = persisted;
            expect(persistedOld.externalId).toBe('tx-old-80d');

            const finalSync = yield* fetchSyncById(sync.id);
            expect(finalSync.mode).toBe(SyncModeEnum.FORWARD);
            expect(finalSync.transactionCount).toBe(EXPECTED_PERSISTED_COUNT);
        }).pipe(Effect.provide(TestLayer))
    );
});
