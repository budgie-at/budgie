import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useUpdateSimpleTransaction } from '../../hook/use-update-simple-transaction.hook';
import { buildExpenseEntry } from '../../utils/build-expense-entry.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { UpdateSimpleTransactionPage } from '../update-simple-transaction-page/update-simple-transaction-page';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateExpenseTransaction = ({ transaction, openFeeOnMount }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const { formRef, ...simpleTransaction } = useUpdateSimpleTransaction({
        transaction,
        transactionType: TransactionTypeEnum.EXPENSE,
        openFeeOnMount
    });
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId: transaction.id });

    return (
        <UpdateSimpleTransactionPage
            form={simpleTransaction.form}
            title={t`Edit Expense`}
            onGoBack={simpleTransaction.handleGoBack}
            right={<UpdateTransactionActionsMenu {...simpleTransaction.actionsMenuProps} />}
        >
            <SimpleQuickForm
                ref={formRef}
                variant="destructive"
                transactionType={TransactionTypeEnum.EXPENSE}
                accountFieldName="fromAccountId"
                transactionTitle={transaction.title}
                mccCategoryId={simpleTransaction.mccCategoryId}
                debtSettlementAccount={simpleTransaction.debtSettlementAccount}
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
