import { t } from '@lingui/core/macro';

import type { DebtOpeningMessagesInterface } from '@budgie/ledger';

export const getDebtOpeningMessages = (): DebtOpeningMessagesInterface => ({
    accountNotFound: accountId => t`Account ${accountId} not found`,
    borrowedDebtExpected: t`Borrowed debt account expected`,
    enterAllAmounts: t`Enter all amounts`,
    onlyIncomeConvertible: t`Only income transactions can be converted`,
    onlySingleEntryIncomeConvertible: t`Only single-entry incomes can be converted`,
    transactionNotFound: t`Transaction not found`
});
