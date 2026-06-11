/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../../../rule/hooks/use-suggest-rule-detection.hook';
import { DebtSettlementPill } from '../../../../transaction/components/debt-settlement-pill/debt-settlement-pill';
import { RefundedPill } from '../../../../transaction/components/refunded-pill/refunded-pill';
import { SimpleQuickForm } from '../../../../transaction/components/simple-quick-form/simple-quick-form';
import { TransactionCardSelector } from '../../../../transaction/components/transaction-card/transaction-card.selector';
import { UpdateTransactionActionsMenu } from '../../../../transaction/components/update-transaction-actions-menu/update-transaction-actions-menu';
import { useUpdateExpenseTransactionActions } from '../../../../transaction/hook/use-update-expense-transaction-actions.hook';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { buildExpenseEntry } from '../../../../transaction/utils/build-expense-entry.util';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';
import { getTransactionCategoryEntries } from '../../../../transaction/utils/get-transaction-category-entries.util';
import { getTransactionFeeEntries } from '../../../../transaction/utils/get-transaction-fee-entries.util';
import { getTransactionHref } from '../../../../transaction/utils/get-transaction-href.util';
import { sumEntryAmounts } from '../../../../transaction/utils/sum-entry-amounts.util';

import type { SimpleQuickFormRefInterface } from '../../../../transaction/interface/simple-quick-form-ref.interface';
import type { UpdateTransactionFormPropsInterface } from '../../../../transaction/interface/update-transaction-form-props.interface';
import type { TransactionCreateInputInterface } from '@budgie/contracts';
import type { Control } from 'react-hook-form';
/* jscpd:ignore-end */

/* jscpd:ignore-start */

const useFeeHeaderAction = (control: Control<TransactionCreateInputInterface>) => {
    const { t } = useLingui();
    const quickFormRef = useRef<SimpleQuickFormRefInterface>(null);
    const entries = useWatch({ control, name: 'entries' });
    const feeAmount = sumEntryAmounts(getTransactionFeeEntries(entries));
    const feeActionLabel = isPositiveNumber(feeAmount) ? t`Edit fee` : t`Set fee`;
    const handleFeePress = () => quickFormRef.current?.openFee();

    return { feeActionLabel, handleFeePress, quickFormRef };
};

const useExpenseAmountTopContent = (transaction: UpdateTransactionFormPropsInterface['transaction'], onPress: () => void) => (
    <View className="items-center gap-xs">
        <RefundedPill transaction={transaction} onPress={onPress} testID={TransactionCardSelector.RefundedPill(transaction.id)} />
        <DebtSettlementPill transaction={transaction} testID={TransactionCardSelector.DebtSettlementMetadata(transaction.id)} />
    </View>
);

const UpdateExpenseForm = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const { markForEmbedding } = useEmbeddingGenerator();

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: ExpenseTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void markForEmbedding(transactionId)
    });

    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' });
    const { feeActionLabel, handleFeePress, quickFormRef } = useFeeHeaderAction(form.control);

    const ruleDetection = useSuggestRuleDetection({
        transaction,
        control: form.control
    });

    const handleGoBack = () => void goBackOrReplace('/');
    const isConsolidated = isDefined(transaction.consolidationType);
    const {
        handleOpenConvert,
        handleOpenRefundSources,
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        handleRevert,
        hasDebtSettlement
    } = useUpdateExpenseTransactionActions({
        transaction,
        transactionId,
        fromAccountId
    });
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};
    const debtSettlementProps =
        categoryEntries.length === 1 && !hasDebtSettlement
            ? { onAttachDebtSettlement: handleOpenDebtSettlement, attachDebtSettlementLabel: t`Attach debt repayment` }
            : {};
    const detachDebtSettlementProps = hasDebtSettlement ? { onDetachDebtSettlement: handleDetachDebtSettlement } : {};
    const amountTopContent = useExpenseAmountTopContent(transaction, handleOpenRefundSources);

    return (
        <FormProvider {...form}>
            <FullPage
                header={
                    <PageHeader
                        title={t`Edit Expense`}
                        onGoBack={handleGoBack}
                        right={
                            <UpdateTransactionActionsMenu
                                onDelete={handleDelete}
                                isConsolidated={isConsolidated}
                                onRevert={handleRevert}
                                onFeePress={handleFeePress}
                                feeActionLabel={feeActionLabel}
                                {...debtSettlementProps}
                                {...detachDebtSettlementProps}
                                {...transferConvertProps}
                            />
                        }
                    />
                }
            >
                <SimpleQuickForm
                    ref={quickFormRef}
                    variant="destructive"
                    transactionType={TransactionTypeEnum.EXPENSE}
                    accountFieldName="fromAccountId"
                    transactionTitle={transaction.title}
                    mccCategoryId={categoryEntries.at(0)?.mccCategoryId ?? null}
                    amountTopContent={amountTopContent}
                    buildEntries={buildExpenseEntry}
                    onSubmit={handleSubmit}
                    onCancel={handleGoBack}
                    ruleDetectionMode={ruleDetection.mode}
                    suggestRuleData={ruleDetection.suggestRuleData}
                    updateRuleData={ruleDetection.updateRuleData}
                    matchingRulesCount={ruleDetection.matchingRulesCount}
                    matchingRuleIds={ruleDetection.matchingRuleIds}
                    onRuleCreated={ruleDetection.onRuleCreated}
                    onDismiss={ruleDetection.onDismiss}
                    onCreatingChange={ruleDetection.onCreatingChange}
                    showInlineFeeAction={false}
                />
            </FullPage>
        </FormProvider>
    );
};
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function UpdateExpenseTransactionPage() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const transactionId = Number(id);
    const { transaction, isLoading } = useGetTransactionByIdQuery(transactionId);
    const parentTransactionId = transaction?.consolidationParentTransactionId ?? 0;
    const { transaction: parentTransaction, isLoading: isParentLoading } = useGetTransactionByIdQuery(parentTransactionId);

    if (isLoading) {
        return null;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    if (isDefined(transaction.consolidationParentTransactionId)) {
        return isParentLoading || !isDefined(parentTransaction) ? null : <Redirect href={getTransactionHref(parentTransaction)} />;
    }

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return <Redirect href={getTransactionHref(transaction)} />;
    }

    return <UpdateExpenseForm transaction={transaction} transactionId={transactionId} />;
}
/* jscpd:ignore-end */
