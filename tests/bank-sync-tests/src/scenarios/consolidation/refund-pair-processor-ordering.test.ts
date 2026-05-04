import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, seedAmountTransferPair } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-processor-ordering', () => {
    it('lets the transfer-pair processor reparent first when an income is also a transfer-pair partner', async () => {
        const { expense, income } = seedAmountTransferPair(250 * PRECISION);

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);

        const transferCanonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(transferCanonicals).toHaveLength(1);

        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(transferCanonicals[0].id);
        expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(transferCanonicals[0].id);

        const refundCanonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.REFUND);
        expect(refundCanonicals).toHaveLength(0);
    });
});
