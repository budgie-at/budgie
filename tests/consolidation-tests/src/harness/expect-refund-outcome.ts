import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { runConsolidation } from './run-consolidation';
import { testQueryService } from './test-context';

export const expectRefundOutcome = (expenseId: number, refundIds: readonly number[], expectedParentIds: ReadonlyArray<number | null>) =>
    Effect.gen(function* () {
        expect((yield* testQueryService.fetchTransactionById(expenseId)).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(
            (yield* Effect.forEach(refundIds, refundId => testQueryService.fetchTransactionById(refundId))).map(
                refund => refund.consolidationParentTransactionId
            )
        ).toEqual(expectedParentIds);
    });

export const expectRefundNotConsolidated = (refundId: number) =>
    Effect.gen(function* () {
        const result = yield* runConsolidation();

        expect(result.consolidated).toBe(0);
        expect((yield* testQueryService.fetchTransactionById(refundId)).consolidationParentTransactionId).toBeNull();
    });
