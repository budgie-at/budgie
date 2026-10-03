import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from './run-consolidation';
import { testSeedService } from './test-context';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

export const runRefundScenario = Effect.fnUntraced(function* (input: {
    readonly beforeConsolidation?: (fixture: {
        readonly account: AccountEntityInterface;
        readonly expense: TransactionEntityInterface;
        readonly refunds: TransactionEntityInterface[];
    }) => Effect.Effect<unknown, unknown>;
    readonly expenseAmount: number;
    readonly expenseFeeAmount?: number;
    readonly expenseOperatedAt?: Date;
    readonly externalIdPrefix?: string;
    readonly mccCategoryId?: number | null;
    readonly refundAmounts: readonly number[];
    readonly refundDelaySeconds?: number;
    readonly refundMccCategoryId?: number | null;
    readonly refundTitle?: string;
    readonly refundTitles?: readonly string[];
    readonly title?: string;
}) {
    const account = yield* testSeedService.account({ externalId: 'mono-card' });
    const { expense, refunds } = yield* testSeedService.refundedExpense({ ...input, accountId: account.id });

    if (isDefined(input.beforeConsolidation)) {
        yield* input.beforeConsolidation({ account, expense, refunds });
    }

    const result = yield* runConsolidation();

    return { account, consolidated: result.consolidated, expense, refunds };
});
