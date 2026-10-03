import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { testQueryService } from './test-context';

export const expectRefundCanonicalTags = (transactionId: number, tagIds: number[]) =>
    Effect.gen(function* () {
        expect((yield* testQueryService.fetchTransactionById(transactionId)).consolidationType).toBe(
            TransactionConsolidationTypeEnum.REFUND
        );
        expect(yield* testQueryService.fetchTransactionTagIds(transactionId)).toEqual(tagIds);
    });
