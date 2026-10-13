import type { DebtOpeningMessagesInterface } from '@budgie/ledger';

export const DEBT_OPENING_MESSAGES: DebtOpeningMessagesInterface = {
    accountNotFound: accountId => `Account ${accountId} not found`,
    borrowedDebtExpected: 'Borrowed debt account expected',
    enterAllAmounts: 'Enter all amounts',
    onlyIncomeConvertible: 'Only income transactions can be converted',
    onlySingleEntryIncomeConvertible: 'Only single-entry incomes can be converted',
    transactionNotFound: 'Transaction not found'
};
