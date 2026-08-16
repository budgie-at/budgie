import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useTransactionFeeFormActions } from '../../hook/use-transaction-fee-form-actions.hook';
import { useUpdateSimpleTransaction } from '../../hook/use-update-simple-transaction.hook';
import { useUpdateTransactionSharedActions } from '../../hook/use-update-transaction-shared-actions.hook';
import { buildExpenseEntry } from '../../utils/build-expense-entry.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { UpdateSimpleTransactionPage } from '../update-simple-transaction-page/update-simple-transaction-page';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateExpenseTransaction = ({ transaction, openFeeOnMount }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const transactionId = transaction.id;
    const simpleTransaction = useUpdateSimpleTransaction({
        transaction,
        transactionId,
        schema: ExpenseTransactionCreateInputSchema
    });
    const { formRef, handleFeePress } = useTransactionFeeFormActions(openFeeOnMount);

    const fromAccountId = useWatch({ control: simpleTransaction.form.control, name: 'fromAccountId' });
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const {
        debtSettlementAccountTitle,
        handleDetachDebtSettlement,
        handleOpenConvert,
        handleOpenDebtSettlement,
        handleRevert,
        hasDebtSettlement
    } = useUpdateTransactionSharedActions({
        transaction,
        transactionAccountId: fromAccountId,
        transactionId,
        transactionType: TransactionTypeEnum.EXPENSE
    });
    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId });
    const mccCategoryId = simpleTransaction.categoryEntries.at(0)?.mccCategoryId ?? null;
    const canConvertToTransfer = simpleTransaction.categoryEntries.length === 1;
    const debtSettlementProps = hasDebtSettlement
        ? { onDetachDebtSettlement: handleDetachDebtSettlement }
        : {
              onAttachDebtSettlement: handleOpenDebtSettlement,
              ...(isDefined(debtSettlementAccountTitle) && { attachDebtSettlementLabel: debtSettlementAccountTitle })
          };

    return (
        <UpdateSimpleTransactionPage
            form={simpleTransaction.form}
            title={t`Edit Expense`}
            onGoBack={simpleTransaction.handleGoBack}
            right={
                <UpdateTransactionActionsMenu
                    onDelete={simpleTransaction.handleDelete}
                    isConsolidated={simpleTransaction.isConsolidated}
                    onRevert={handleRevert}
                    onFeePress={handleFeePress}
                    {...(canConvertToTransfer && { onConvertToTransfer: handleOpenConvert })}
                    {...debtSettlementProps}
                />
            }
        >
            <SimpleQuickForm
                ref={formRef}
                variant="destructive"
                transactionType={TransactionTypeEnum.EXPENSE}
                accountFieldName="fromAccountId"
                transactionTitle={transaction.title}
                mccCategoryId={mccCategoryId}
                debtSettlementAccountTitle={debtSettlementAccountTitle}
                amountTopContent={
                    <RefundedPill
                        key={`${transaction.id}-${transaction.consolidationType}`}
                        transaction={transaction}
                        onPress={handleOpenRefundSources}
                        testID={TransactionCardSelector.RefundedPill(transaction.id)}
                    />
                }
                buildEntries={buildExpenseEntry}
                onSubmit={simpleTransaction.handleSubmit}
                onCancel={simpleTransaction.handleGoBack}
                rulePillSlotProps={simpleTransaction}
                showInlineFeeAction={false}
            />
        </UpdateSimpleTransactionPage>
    );
};
