import { ExpenseTransactionCreateEntitySchema, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TransactionForm } from '../transaction-form/transaction-form';

export const CreateExpenseTransaction = () => {
    const { t } = useLingui();

    return (
        <TransactionForm
            transactionType={TransactionTypeEnum.EXPENSE}
            entryType={TransactionEntryTypeEnum.CREDIT}
            variant="destructive"
            icon="TrendingDown"
            title={t`New Expense`}
            buttonText={t`Add Expense`}
            schema={ExpenseTransactionCreateEntitySchema}
        />
    );
};
