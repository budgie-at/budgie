import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { TransferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb, TestLayer } from '../../harness';

describe('monobank/consolidation-scope-enqueue', () => {
    it.effect('enqueues consolidation with the changed transaction scope after sync creates a transaction', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
            yield* setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({
                    id: 'tx-scoped-sync',
                    amount: -2500,
                    hold: false,
                    time: Math.floor(new Date('2026-01-13T09:42:53.000Z').getTime() / 1000)
                })
            ]);

            yield* monobankSyncService.sync();

            const [transaction] = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.MONOBANK));

            expect(transaction).toBeDefined();
            if (!isDefined(transaction)) {
                return;
            }

            expect(vi.mocked(transferConsolidationDrainerService.enqueue)).toHaveBeenCalledWith(
                expect.objectContaining({
                    transactionIds: [transaction.id]
                })
            );
        }).pipe(Effect.provide(TestLayer))
    );
});
