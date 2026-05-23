import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankSyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    buildMonobank,
    fetchBankSyncById,
    fetchPersistedMonobankTransactions,
    monobankStub,
    setupBackwardSweepFixture
} from '../../harness';

import type { MonobankTransactionApiInterface } from '@budgie/bank-sync';

const SECONDS_PER_DAY = 86_400;
const MS_PER_SECOND = 1_000;
const OLD_TRANSACTION_AGE_DAYS = 80;
const OLD_TRANSACTION_AMOUNT_KOPECKS = -1234;
const EXPECTED_PERSISTED_COUNT = 1;

describe('monobank/old-transactions-after-dormant-month', () => {
    // eslint-disable-next-line max-statements -- Backward sweep scenario: fixture + tx fixture + MSW stack + sync + 5 assertions
    it('surfaces an old transaction sitting beyond two empty 31-day windows, then terminates at the dormancy boundary', async () => {
        const sweepStart = new Date();
        const bankSync = setupBackwardSweepFixture(sweepStart);

        const oldTransactionTimeSeconds = Math.floor(sweepStart.getTime() / MS_PER_SECOND) - OLD_TRANSACTION_AGE_DAYS * SECONDS_PER_DAY;
        const oldTransaction: MonobankTransactionApiInterface = buildMonobank.transaction({
            id: 'tx-old-80d',
            amount: OLD_TRANSACTION_AMOUNT_KOPECKS,
            hold: false,
            time: oldTransactionTimeSeconds
        });

        monobankStub.statementBatches([[], [], [oldTransaction], [], [], []]);

        await monobankSyncService.sync();

        const persisted = fetchPersistedMonobankTransactions();
        expect(persisted).toHaveLength(EXPECTED_PERSISTED_COUNT);
        const [persistedOld] = persisted;
        expect(persistedOld.externalId).toBe('tx-old-80d');

        const finalSync = fetchBankSyncById(bankSync.id);
        expect(finalSync.mode).toBe(BankSyncModeEnum.FORWARD);
        expect(finalSync.transactionCount).toBe(EXPECTED_PERSISTED_COUNT);
    });
});
