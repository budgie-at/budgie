import { IncomeTransactionCreateEntitySchema, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TransactionForm } from '../transaction-form/transaction-form';

export const CreateIncomeTransaction = () => {
    const { t } = useLingui();

    return (
        <TransactionForm
            transactionType={TransactionTypeEnum.INCOME}
            entryType={TransactionEntryTypeEnum.DEBIT}
            variant="positive"
            icon="TrendingUp"
            title={t`New Income`}
            buttonText={t`Add Income`}
            schema={IncomeTransactionCreateEntitySchema}
        />
    );
};
