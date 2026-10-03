import { testSeedService } from './test-context';

export const seedExpenseWithoutRefund = (input: {
    readonly accountId: number;
    readonly expenseAmount: number;
    readonly expenseOperatedAt: Date;
    readonly externalIdPrefix: string;
    readonly title: string;
}) => testSeedService.refundedExpense({ ...input, refundAmounts: [] });
