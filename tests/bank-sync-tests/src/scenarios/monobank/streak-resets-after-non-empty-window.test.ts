import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankSyncModeEnum } from '@budgie/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    buildMonobank,
    fetchBankSyncById,
    fetchPersistedMonobankTransactions,
    monobankStub,
    setupBackwardSweepFixture
} from '../../harness';

import type { MonobankTransactionApiInterface } from '@budgie/bank-sync';

const FROZEN_SWEEP_START = new Date('2026-06-15T00:00:00Z');
const SECONDS_PER_DAY = 86_400;
const MS_PER_SECOND = 1_000;
const MID_STREAK_TX_AGE_DAYS = 70;
const MID_STREAK_TX_AMOUNT_KOPECKS = -777;

describe('monobank/streak-resets-after-non-empty-window', () => {
    beforeEach(() => {
        vi.setSystemTime(FROZEN_SWEEP_START);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

     
    it('clears the streak anchor on a non-empty window so a later empty page must re-anchor before dormancy can trip', async () => {
        const bankSync = setupBackwardSweepFixture(FROZEN_SWEEP_START);

        const midStreakTransactionTimeSeconds =
            Math.floor(FROZEN_SWEEP_START.getTime() / MS_PER_SECOND) - MID_STREAK_TX_AGE_DAYS * SECONDS_PER_DAY;
        const midStreakTransaction: MonobankTransactionApiInterface = buildMonobank.transaction({
            id: 'tx-mid-streak-70d',
            amount: MID_STREAK_TX_AMOUNT_KOPECKS,
            hold: false,
            time: midStreakTransactionTimeSeconds
        });

        monobankStub.statementBatches([[], [], [midStreakTransaction], []]);

        await monobankSyncService.sync();

        const persisted = fetchPersistedMonobankTransactions();
        expect(persisted).toHaveLength(1);
        expect(persisted[0].externalId).toBe('tx-mid-streak-70d');

        const finalSync = fetchBankSyncById(bankSync.id);
        expect(finalSync.mode).toBe(BankSyncModeEnum.FORWARD);
        expect(finalSync.backwardCompletedAt).not.toBeNull();
        expect(finalSync.backwardSyncedAt).toBeNull();
    });
});
