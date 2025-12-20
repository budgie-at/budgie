import { TransactionTypeEnum, TransferTransactionCreateEntitySchema } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SystemCategoryIdEnum } from '../../../category/enum/system-category-id.enum';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { TransferTransactionForm } from '../transfer-transaction-form/transfer-transaction-form';

export const CreateTransferTransaction = () => {
    const { t } = useLingui();

    const { form, handleSubmit } = useCreateTransactionForm({
        categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
        schema: TransferTransactionCreateEntitySchema,
        type: TransactionTypeEnum.TRANSFER,
        fromAccountId: 0,
        toAccountId: 0
    });

    return (
        <TransferTransactionForm
            control={form.control}
            setValue={form.setValue}
            title={t`New Transfer`}
            variant="default"
            icon="ArrowRightLeft"
            onSubmit={handleSubmit}
            buttonText={t`Add Transfer`}
        />
    );
};
