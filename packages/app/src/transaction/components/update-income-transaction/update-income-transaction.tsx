import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useOpenRefundConvert } from '../../hook/use-open-refund-convert.hook';
import { useUpdateSimpleTransaction } from '../../hook/use-update-simple-transaction.hook';
import { useUpdateTransactionSharedActions } from '../../hook/use-update-transaction-shared-actions.hook';
import { buildIncomeEntry } from '../../utils/build-income-entry.util';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { UpdateSimpleTransactionPage } from '../update-simple-transaction-page/update-simple-transaction-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateIncomeTransaction = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const transactionId = transaction.id;
    const simpleTransaction = useUpdateSimpleTransaction({
        transaction,
        transactionId,
        schema: IncomeTransactionCreateInputSchema
    });

    const toAccountId = useWatch({ control: simpleTransaction.form.control, name: 'toAccountId' });
    const mccCategoryId = simpleTransaction.categoryEntries.at(0)?.mccCategoryId ?? null;
    const handleOpenRefundConvert = useOpenRefundConvert(transactionId);
    const {
        debtSettlementAccountTitle,
        handleDetachDebtSettlement,
        handleOpenConvert,
        handleOpenDebtSettlement,
        handleRevert,
        hasDebtSettlement
    } = useUpdateTransactionSharedActions({
        form: simpleTransaction.form,
        transaction,
        transactionAccountId: toAccountId,
        transactionId,
        transactionType: TransactionTypeEnum.INCOME
    });
    const canConvertToRefund = !simpleTransaction.isConsolidated && !isDefined(transaction.consolidationParentTransactionId);
    const refundConvertProps = canConvertToRefund ? { onConvertToRefund: handleOpenRefundConvert } : {};
    const transferConvertProps = simpleTransaction.categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};
    const debtSettlementProps = hasDebtSettlement
        ? { onDetachDebtSettlement: handleDetachDebtSettlement }
        : {
              onAttachDebtSettlement: handleOpenDebtSettlement,
              ...(isDefined(debtSettlementAccountTitle) && { attachDebtSettlementLabel: debtSettlementAccountTitle })
          };

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
            {...debtSettlementProps}
        >
            <SimpleQuickForm
                variant="positive"
                transactionType={TransactionTypeEnum.INCOME}
                accountFieldName="toAccountId"
                transactionTitle={transaction.title}
                mccCategoryId={mccCategoryId}
                debtSettlementAccountTitle={debtSettlementAccountTitle}
                buildEntries={buildIncomeEntry}
                onSubmit={simpleTransaction.handleSubmit}
                onCancel={simpleTransaction.handleGoBack}
                rulePillSlotProps={simpleTransaction}
            />
        </UpdateSimpleTransactionPage>
    );
};
