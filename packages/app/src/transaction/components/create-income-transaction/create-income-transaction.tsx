import { IncomeTransactionCreateEntitySchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { TransactionForm } from '../transaction-form/transaction-form';

export const CreateIncomeTransaction = () => {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();

    const { form, handleSubmit } = useCreateTransactionForm({
        schema: IncomeTransactionCreateEntitySchema,
        toAccountId: defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.INCOME,
        fromAccountId: null
    });

    return (
        <TransactionForm
            accountFieldName="toAccountId"
            control={form.control}
            onSubmit={handleSubmit}
            setValue={form.setValue}
            variant="positive"
            icon="TrendingUp"
            title={t`New Income`}
            buttonText={t`Add Income`}
        />
    );
};
