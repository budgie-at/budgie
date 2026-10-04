import type { ManualExpenseDuplicateAccountsInterface } from './manual-expense-duplicate-accounts.interface';

export interface ManualExpenseDuplicatePairInputInterface {
    readonly accounts: ManualExpenseDuplicateAccountsInterface;
    readonly index: number;
    readonly manualAmountDelta?: number;
    readonly manualCategoryId?: number | null;
    readonly manualComment?: string;
    readonly manualOperatedAtOffsetSeconds?: number;
}
