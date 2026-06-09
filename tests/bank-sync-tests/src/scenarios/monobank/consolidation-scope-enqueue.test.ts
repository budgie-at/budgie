import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb } from '../../harness';

import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';

describe('monobank/consolidation-scope-enqueue', () => {
    beforeEach(() => {
        vi.mocked(transferConsolidationDrainerService.enqueue).mockClear();
    });

    it('enqueues consolidation with the changed transaction scope after sync creates a transaction', async () => {
        setupMonobankFixture();
        monobankStub.statement([
            buildMonobank.transaction({
                id: 'tx-scoped-sync',
                amount: -2500,
                hold: false,
                time: Math.floor(new Date('2026-01-13T09:42:53.000Z').getTime() / 1000)
            })
        ]);

        await monobankSyncService.sync();

        const transaction = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.MONOBANK))
            .get();

        expect(transaction).toBeDefined();
        if (!isDefined(transaction)) {
            return;
        }

        expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledWith(
            TransferConsolidationDrainReasonEnum.MONOBANK_SYNC,
            expect.objectContaining({
                transactionIds: [transaction.id]
            })
        );
    });
});
