import { TransactionWithRelationsEntityInterface, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useDeleteTransactionMutation } from '../../hook/use-delete-transaction.mutation';
import { useUpdateTransactionForm } from '../../hook/use-update-transaction-form.hook';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { TransferTransactionForm } from '../transfer-transaction-form/transfer-transaction-form';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const UpdateTransferTransaction = ({ transaction }: Props) => {
    const { t } = useLingui();

    const { form, handleSubmit } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: TransferTransactionCreateInputSchema,
        id: transaction.id
    });

    const { confirmDelete } = useDeleteTransactionMutation();

    const handleDelete = () => void confirmDelete(transaction.id);

    return (
        <TransferTransactionForm
            control={form.control}
            setValue={form.setValue}
            setError={form.setError}
            clearErrors={form.clearErrors}
            title={t`Edit Transfer`}
            variant="default"
            icon="ArrowRightLeft"
            onSubmit={handleSubmit}
            buttonText={t`Update Transfer`}
            onDelete={handleDelete}
        />
    );
};
