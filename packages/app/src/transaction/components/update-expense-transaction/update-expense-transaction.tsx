import {
    TransactionExpenseWithRelationsEntityInterface,
    TransactionNegativeAdjustmentWithRelationsEntityInterface
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useUpdateTransactionForm } from '../../hook/use-update-transaction-form.hook';
import { ExpenseTransactionCreateInputSchema } from '../../schema/transaction-create-input.schema';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { LiabilityTransactionForm } from '../liability-transaction-form/liability-transaction-form';

interface Props {
    readonly transaction: TransactionExpenseWithRelationsEntityInterface | TransactionNegativeAdjustmentWithRelationsEntityInterface;
}

export const UpdateExpenseTransaction = ({ transaction }: Props) => {
    const { t } = useLingui();

    const { form, handleSubmit } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: ExpenseTransactionCreateInputSchema,
        id: transaction.id
    });

    return (
        <LiabilityTransactionForm
            accountFieldName="fromAccountId"
            control={form.control}
            onSubmit={handleSubmit}
            setValue={form.setValue}
            variant="destructive"
            icon="TrendingDown"
            title={t`Edit Expense`}
            buttonText={t`Update Expense`}
        />
    );
};
