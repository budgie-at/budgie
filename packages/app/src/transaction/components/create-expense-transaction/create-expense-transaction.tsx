import { ExpenseTransactionCreateEntitySchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { useTransactionForm } from '../../hook/use-transaction-form.hook';
import { TransactionForm } from '../transaction-form/transaction-form';

export const CreateExpenseTransaction = () => {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();

    const { form, handleSubmit } = useTransactionForm({
        schema: ExpenseTransactionCreateEntitySchema,
        fromAccountId: defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null
    });

    return (
        <TransactionForm
            accountFieldName="fromAccountId"
            control={form.control}
            onSubmit={handleSubmit}
            setValue={form.setValue}
            variant="destructive"
            icon="TrendingDown"
            title={t`New Expense`}
            buttonText={t`Add Expense`}
        />
    );
};
