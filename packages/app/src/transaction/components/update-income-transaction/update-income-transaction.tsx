import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useUpdateIncomeTransactionActions } from '../../hook/use-update-income-transaction-actions.hook';
import { useUpdateSimpleTransaction } from '../../hook/use-update-simple-transaction.hook';
import { buildIncomeEntry } from '../../utils/build-income-entry.util';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { UpdateSimpleTransactionPage } from '../update-simple-transaction-page/update-simple-transaction-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateIncomeTransaction = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const simpleTransaction = useUpdateSimpleTransaction({
        transaction,
        transactionId,
        schema: IncomeTransactionCreateInputSchema
    });

    const toAccountId = useWatch({ control: simpleTransaction.form.control, name: 'toAccountId' });
    const mccCategoryId = simpleTransaction.categoryEntries.at(0)?.mccCategoryId ?? null;
    const { handleOpenConvert, handleOpenRefundConvert, handleRevert } = useUpdateIncomeTransactionActions({
        transaction,
        transactionId,
        toAccountId
    });
    const canConvertToRefund = !simpleTransaction.isConsolidated && !isDefined(transaction.consolidationParentTransactionId);
    const refundConvertProps = canConvertToRefund ? { onConvertToRefund: handleOpenRefundConvert } : {};
    const transferConvertProps = simpleTransaction.categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};

    return (
        <UpdateSimpleTransactionPage
            form={simpleTransaction.form}
            title={t`Edit Income`}
            isConsolidated={simpleTransaction.isConsolidated}
            onGoBack={simpleTransaction.handleGoBack}
            onDelete={simpleTransaction.handleDelete}
            onRevert={handleRevert}
            {...refundConvertProps}
            {...transferConvertProps}
        >
            <SimpleQuickForm
                variant="positive"
                transactionType={TransactionTypeEnum.INCOME}
                accountFieldName="toAccountId"
                transactionTitle={transaction.title}
                mccCategoryId={mccCategoryId}
                buildEntries={buildIncomeEntry}
                onSubmit={simpleTransaction.handleSubmit}
                onCancel={simpleTransaction.handleGoBack}
                rulePillSlotProps={simpleTransaction}
            />
        </UpdateSimpleTransactionPage>
    );
};
