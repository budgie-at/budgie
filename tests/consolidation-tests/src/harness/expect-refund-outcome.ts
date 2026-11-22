import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

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
