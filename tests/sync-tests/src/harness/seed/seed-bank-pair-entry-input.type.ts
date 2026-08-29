import type { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export type SeedBankPairEntryInputType = Pick<TransactionEntryCreateEntityInterface, 'accountId' | 'amount'> & {
    readonly mccCategoryId?: number | null;
    readonly exchangeRate?: number;
    readonly toIban?: string | null;
};
