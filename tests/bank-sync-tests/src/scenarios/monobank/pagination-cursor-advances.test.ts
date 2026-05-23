import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankSyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { buildMonobank, fetchBankSyncById, fetchPersistedMonobankTransactions, monobankStub, setupMonobankFixture } from '../../harness';

import type { MonobankTransactionApiInterface } from '@budgie/bank-sync';

const PAGE_SIZE = 500;
const MS_PER_SECOND = 1_000;
const PAGE_TX_AMOUNT_KOPECKS = -1000;
const PAGE_BASE_TIME = new Date('2026-01-01T00:00:00Z');
const FIXTURE_FORWARD_FROM = new Date('2025-01-01T00:00:00Z');

const buildBatch = (offset: number): MonobankTransactionApiInterface[] =>
    Array.from({ length: PAGE_SIZE }, (_, index) => {
        const ordinal = offset + index;

        return buildMonobank.transaction({
            id: `tx-page-${ordinal}`,
            amount: PAGE_TX_AMOUNT_KOPECKS,
            hold: false,
            time: Math.floor(PAGE_BASE_TIME.getTime() / MS_PER_SECOND) + ordinal
        });
    });

describe('monobank/pagination-cursor-advances', () => {
    it('processes a 500-row page, advances the cursor, and continues until the next page is empty', async () => {
        const { bankSync } = setupMonobankFixture('mono-acc-1', BankSyncModeEnum.FORWARD, FIXTURE_FORWARD_FROM);

        monobankStub.statementBatches([buildBatch(0)]);

        await monobankSyncService.sync();

        expect(fetchPersistedMonobankTransactions()).toHaveLength(PAGE_SIZE);

        const finalSync = fetchBankSyncById(bankSync.id);
        expect(finalSync.forwardSyncedAt).not.toBeNull();
        expect(finalSync.transactionCount).toBe(PAGE_SIZE);
    });
});
