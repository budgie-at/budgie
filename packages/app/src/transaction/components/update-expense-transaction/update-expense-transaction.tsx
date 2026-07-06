import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useUpdateSimpleTransaction } from '../../hook/use-update-simple-transaction.hook';
import { useUpdateTransactionSharedActions } from '../../hook/use-update-transaction-shared-actions.hook';
import { buildExpenseEntry } from '../../utils/build-expense-entry.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { UpdateSimpleTransactionPage } from '../update-simple-transaction-page/update-simple-transaction-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateExpenseTransaction = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const transactionId = transaction.id;
    const simpleTransaction = useUpdateSimpleTransaction({
        transaction,
        transactionId,
        schema: ExpenseTransactionCreateInputSchema
    });

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
        form: simpleTransaction.form,
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
            isConsolidated={simpleTransaction.isConsolidated}
            onGoBack={simpleTransaction.handleGoBack}
            onDelete={simpleTransaction.handleDelete}
            onRevert={handleRevert}
            {...(canConvertToTransfer && { onConvertToTransfer: handleOpenConvert })}
            {...debtSettlementProps}
        >
            <SimpleQuickForm
                variant="destructive"
                transactionType={TransactionTypeEnum.EXPENSE}
                accountFieldName="fromAccountId"
                transactionTitle={transaction.title}
                mccCategoryId={mccCategoryId}
                debtSettlementAccountTitle={debtSettlementAccountTitle}
                amountTopContent={
                    <RefundedPill
                        transaction={transaction}
                        onPress={handleOpenRefundSources}
                        testID={TransactionCardSelector.RefundedPill(transaction.id)}
                    />
                }
                buildEntries={buildExpenseEntry}
                onSubmit={simpleTransaction.handleSubmit}
                onCancel={simpleTransaction.handleGoBack}
                rulePillSlotProps={simpleTransaction}
            />
        </UpdateSimpleTransactionPage>
    );
};
