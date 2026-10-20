export interface DebtOpeningMessagesInterface {
    readonly accountNotFound: (accountId: number) => string;
    readonly borrowedDebtExpected: string;
    readonly enterAllAmounts: string;
    readonly onlyIncomeConvertible: string;
    readonly onlySingleEntryIncomeConvertible: string;
    readonly transactionNotFound: string;
}
