import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seedAmountTransferPair, TestLayer, testQueryService } from '../../harness';

describe('consolidation/refund-pair-processor-ordering', () => {
    it.effect('lets the transfer-pair processor reparent first when an income is also a transfer-pair partner', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { expense, income } = yield* seedAmountTransferPair(250 * PRECISION);

            const result = yield* transferConsolidationService.consolidate(null);
            expect(result.consolidated).toBe(1);

            const transferCanonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(transferCanonicals).toHaveLength(1);

            expect((yield* testQueryService.findTransactionById(expense.id)).consolidationParentTransactionId).toBe(
                transferCanonicals[0].id
            );
            expect((yield* testQueryService.findTransactionById(income.id)).consolidationParentTransactionId).toBe(
                transferCanonicals[0].id
            );

            const refundCanonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.REFUND);
            expect(refundCanonicals).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
