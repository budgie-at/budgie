import { ExpenseTransactionCreateEntitySchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { transactionService } from '../../service/transaction.service';
import { LiabilityTransactionForm } from '../liability-transaction-form/liability-transaction-form';

export const CreateExpenseTransaction = () => {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternal(data),
        schema: ExpenseTransactionCreateEntitySchema,
        fromAccountId: defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null
    });

    return (
        <LiabilityTransactionForm
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
