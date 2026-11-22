import { PRECISION } from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runRefundScenario, TestLayer, testQueryService } from '../../harness';

describe('consolidation/refund-auto-pair-marker', () => {
    it.effect('keeps a refund open to automatic pairing when marking its account external unpairs it', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const { account, expense, refunds, result } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [120 * PRECISION]
            });

            expect(result.consolidated).toBe(1);

            yield* accountArchiveService.markExternalById(account.id);

            expect(yield* testQueryService.findTransactionById(refunds[0].id)).toMatchObject({
                consolidationParentTransactionId: null,
                refundAutoPairDisabled: false
            });
            expect((yield* testQueryService.findTransactionById(expense.id)).consolidationType).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
