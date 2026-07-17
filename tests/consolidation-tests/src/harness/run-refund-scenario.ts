import { runConsolidation } from './run-consolidation';
import { testSeedService } from './test-context';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

export const runRefundScenario = async (input: {
    readonly beforeConsolidation?: (fixture: {
        readonly account: AccountEntityInterface;
        readonly expense: TransactionEntityInterface;
        readonly refunds: TransactionEntityInterface[];
    }) => void;
    readonly expenseAmount: number;
    readonly expenseOperatedAt?: Date;
    readonly externalIdPrefix?: string;
    readonly mccCategoryId?: number | null;
    readonly refundAmounts: readonly number[];
    readonly refundDelaySeconds?: number;
    readonly refundMccCategoryId?: number | null;
    readonly refundTitle?: string;
    readonly title?: string;
}): Promise<{
    readonly account: AccountEntityInterface;
    readonly consolidated: number;
    readonly expense: TransactionEntityInterface;
    readonly refunds: TransactionEntityInterface[];
}> => {
    const account = testSeedService.account({ externalId: 'mono-card' });
    const { expense, refunds } = testSeedService.refundedExpense({ ...input, accountId: account.id });

    input.beforeConsolidation?.({ account, expense, refunds });

    const result = await runConsolidation();

    return { account, consolidated: result.consolidated, expense, refunds };
};
