import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useUpdateTransactionForm } from '../../hook/use-update-transaction-form.hook';
import { TransferTransactionCreateInputSchema } from '../../schema/transaction-create-input.schema';
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

    return (
        <TransferTransactionForm
            control={form.control}
            setValue={form.setValue}
            title={t`Edit Transfer`}
            variant="default"
            icon="ArrowRightLeft"
            onSubmit={handleSubmit}
            buttonText={t`Update Transfer`}
        />
    );
};
