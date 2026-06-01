import type { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export type SeedBankPairEntryInputType = Pick<TransactionEntryCreateEntityInterface, 'accountId' | 'amount'> &
    Partial<Pick<TransactionEntryCreateEntityInterface, 'exchangeRate' | 'mccCategoryId' | 'toIban'>>;
