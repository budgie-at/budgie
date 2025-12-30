import {
    IncomeTransactionCreateInputSchema,
    TransactionIncomeWithRelationsEntityInterface,
    TransactionPositiveAdjustmentWithRelationsEntityInterface
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useDeleteTransactionMutation } from '../../hook/use-delete-transaction.mutation';
import { useUpdateTransactionForm } from '../../hook/use-update-transaction-form.hook';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { LiabilityTransactionForm } from '../liability-transaction-form/liability-transaction-form';

interface Props {
    readonly transaction: TransactionIncomeWithRelationsEntityInterface | TransactionPositiveAdjustmentWithRelationsEntityInterface;
}

export const UpdateIncomeTransaction = ({ transaction }: Props) => {
    const { t } = useLingui();

    const { form, handleSubmit } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: IncomeTransactionCreateInputSchema,
        id: transaction.id
    });

    const { confirmDelete } = useDeleteTransactionMutation();

    const handleDelete = () => void confirmDelete(transaction.id);

    return (
        <LiabilityTransactionForm
            accountFieldName="toAccountId"
            control={form.control}
            onSubmit={handleSubmit}
            setValue={form.setValue}
            variant="positive"
            icon="TrendingUp"
            title={t`Edit Income`}
            buttonText={t`Update Income`}
            onDelete={handleDelete}
        />
    );
};
