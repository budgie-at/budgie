import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { testQueryService } from '../db/test-query-service';

export const expectParentedToCanonical = (canonicalId: number, transactionIds: readonly number[]) =>
    Effect.forEach(
        transactionIds,
        transactionId =>
            Effect.gen(function* () {
                expect((yield* testQueryService.findTransactionById(transactionId)).consolidationParentTransactionId).toBe(canonicalId);
            }),
        { discard: true }
    );
