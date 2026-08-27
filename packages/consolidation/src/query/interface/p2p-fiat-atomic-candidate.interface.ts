import type { AccountTypeEnum } from '@budgie/contracts';

export interface P2pFiatAtomicCandidateInterface {
    readonly expenseTransactionId: number;
    readonly expenseOperatedAt: number;
    readonly expenseEntryAccountId: number;
    readonly expenseEntryAmount: number;
    readonly expenseEntryExchangeRate: number;
    readonly expenseEntryToIban: string | null;
    readonly expenseAccountType: AccountTypeEnum;
    readonly expenseCurrency: string;
    readonly incomeTransactionId: number;
    readonly incomeOperatedAt: number;
    readonly incomeEntryAccountId: number;
    readonly incomeEntryAmount: number;
    readonly incomeEntryExchangeRate: number;
    readonly incomeEntryToIban: string | null;
    readonly incomeAccountType: AccountTypeEnum;
    readonly incomeCurrency: string;
    readonly expectedExchangeRate: number;
    readonly timeDiff: number;
}
