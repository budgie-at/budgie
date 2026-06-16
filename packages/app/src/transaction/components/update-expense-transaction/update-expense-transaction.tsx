import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { useUpdateExpenseTransactionActions } from '../../hook/use-update-expense-transaction-actions.hook';
import { useUpdateSimpleTransaction } from '../../hook/use-update-simple-transaction.hook';
import { buildExpenseEntry } from '../../utils/build-expense-entry.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { UpdateSimpleTransactionPage } from '../update-simple-transaction-page/update-simple-transaction-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateExpenseTransaction = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const {
        form,
        handleSubmit,
        handleDelete,
        handleGoBack,
        categoryEntries,
        isConsolidated,
        ruleDetectionMode,
        suggestRuleData,
        updateRuleData,
        matchingRulesCount,
        matchingRuleIds,
        onRuleCreated,
        onDismiss,
        onCreatingChange
    } = useUpdateSimpleTransaction({
        transaction,
        transactionId,
        schema: ExpenseTransactionCreateInputSchema
    });

    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' });
    const { handleOpenConvert, handleOpenRefundSources, handleRevert } = useUpdateExpenseTransactionActions({
        transaction,
        transactionId,
        fromAccountId
    });
    const mccCategoryId = categoryEntries.at(0)?.mccCategoryId ?? null;
    const canConvertToTransfer = categoryEntries.length === 1;

    return (
        <UpdateSimpleTransactionPage
            form={form}
            title={t`Edit Expense`}
            isConsolidated={isConsolidated}
            onGoBack={handleGoBack}
            onDelete={handleDelete}
            onRevert={handleRevert}
            {...(canConvertToTransfer && { onConvertToTransfer: handleOpenConvert })}
        >
            <SimpleQuickForm
                variant="destructive"
                transactionType={TransactionTypeEnum.EXPENSE}
                accountFieldName="fromAccountId"
                transactionTitle={transaction.title}
                mccCategoryId={mccCategoryId}
                amountTopContent={
                    <RefundedPill
                        transaction={transaction}
                        onPress={handleOpenRefundSources}
                        testID={TransactionCardSelector.RefundedPill(transaction.id)}
                    />
                }
                buildEntries={buildExpenseEntry}
                onSubmit={handleSubmit}
                onCancel={handleGoBack}
                ruleDetectionMode={ruleDetectionMode}
                suggestRuleData={suggestRuleData}
                updateRuleData={updateRuleData}
                matchingRulesCount={matchingRulesCount}
                matchingRuleIds={matchingRuleIds}
                onRuleCreated={onRuleCreated}
                onDismiss={onDismiss}
                onCreatingChange={onCreatingChange}
            />
        </UpdateSimpleTransactionPage>
    );
};
