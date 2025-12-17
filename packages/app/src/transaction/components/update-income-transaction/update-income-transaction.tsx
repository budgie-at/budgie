import {
    IncomeTransactionCreateEntitySchema,
    TransactionIncomeWithRelationsEntityInterface,
    TransactionPositiveAdjustmentWithRelationsEntityInterface
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useUpdateTransactionForm } from '../../hook/use-update-transaction-form.hook';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { TransactionForm } from '../transaction-form/transaction-form';

interface Props {
    readonly transaction: TransactionIncomeWithRelationsEntityInterface | TransactionPositiveAdjustmentWithRelationsEntityInterface;
}

export const UpdateIncomeTransaction = ({ transaction }: Props) => {
    const { t } = useLingui();

    const { form, handleSubmit } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: IncomeTransactionCreateEntitySchema,
        id: transaction.id
    });

    return (
        <TransactionForm
            accountFieldName="toAccountId"
            control={form.control}
            onSubmit={handleSubmit}
            setValue={form.setValue}
            variant="positive"
            icon="TrendingUp"
            title={t`Edit Income`}
            buttonText={t`Update Income`}
        />
    );
};
