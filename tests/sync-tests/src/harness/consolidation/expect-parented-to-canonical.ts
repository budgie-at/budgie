import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { fetchTransactionById } from '../db/fetch-transaction-by-id';

export const expectParentedToCanonical = (canonicalId: number, transactionIds: readonly number[]) =>
    Effect.forEach(
        transactionIds,
        transactionId =>
            Effect.gen(function* () {
                expect((yield* fetchTransactionById(transactionId)).consolidationParentTransactionId).toBe(canonicalId);
            }),
        { discard: true }
    );
