import type { ManualExpenseDuplicateAccountsInterface } from './manual-expense-duplicate-accounts.interface';
import type { ExternalSourceEnum } from '@budgie/contracts';

export interface ManualExpenseDuplicatePairInputInterface {
    readonly accounts: ManualExpenseDuplicateAccountsInterface;
    readonly index: number;
    readonly manualAmountDelta?: number;
    readonly manualCategoryId?: number | null;
    readonly manualExternalSource?: ExternalSourceEnum;
    readonly manualComment?: string;
    readonly manualOperatedAtOffsetSeconds?: number;
}
