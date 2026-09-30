import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchCanonicalsOfType, fetchTransactionById, seedAmountTransferPair, TestLayer } from '../../harness';

describe('consolidation/refund-pair-processor-ordering', () => {
    it.effect('lets the transfer-pair processor reparent first when an income is also a transfer-pair partner', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { expense, income } = seedAmountTransferPair(250 * PRECISION);

            const result = yield* transferConsolidationService.consolidate(null);
            expect(result.consolidated).toBe(1);

            const transferCanonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(transferCanonicals).toHaveLength(1);

            expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(transferCanonicals[0].id);
            expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(transferCanonicals[0].id);

            const refundCanonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.REFUND);
            expect(refundCanonicals).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
