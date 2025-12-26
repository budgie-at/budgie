import { TransactionTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SystemCategoryIdEnum } from '../../../category/enum/system-category-id.enum';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { transactionService } from '../../service/transaction.service';
import { TransferTransactionForm } from '../transfer-transaction-form/transfer-transaction-form';

export const CreateTransferTransaction = () => {
    const { t } = useLingui();

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternalTransfer(data),
        categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
        schema: TransferTransactionCreateInputSchema,
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
