import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { http, HttpResponse } from 'msw';

import { BankSyncEntityTable, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import type { MonobankTransactionApiInterface } from '@budgie/bank-sync';

import { buildMonobank, setupMonobankFixture, testDb } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

const PAGE_SIZE = 500;

const buildBatch = (offset: number): MonobankTransactionApiInterface[] =>
    Array.from({ length: PAGE_SIZE }, (_, index) => {
        const ordinal = offset + index;
        return buildMonobank.transaction({
            id: `tx-page-${ordinal}`,
            amount: -1000,
            hold: false,
            time: Math.floor(new Date(2026, 0, 1, 0, 0, ordinal).getTime() / 1000)
        });
    });

describe('monobank/pagination-cursor-advances', () => {
    it('processes a 500-row page, advances the cursor, and continues until the next page is empty', async () => {
        const { bankSync } = setupMonobankFixture(undefined, undefined, new Date(2025, 0, 1));

        const batches = [buildBatch(0)];
        monobankServer.use(http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => HttpResponse.json([])));
        for (const batch of [...batches].reverse()) {
            monobankServer.use(
                http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => HttpResponse.json(batch), { once: true })
            );
        }

        await monobankSyncService.sync();

        const persisted = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.MONOBANK))
            .all();
        expect(persisted).toHaveLength(PAGE_SIZE);

        const finalSync = testDb.select().from(BankSyncEntityTable).where(eq(BankSyncEntityTable.id, bankSync.id)).all()[0];
        expect(finalSync.forwardSyncedAt).not.toBeNull();
        expect(finalSync.transactionCount).toBe(PAGE_SIZE);
    });
});
