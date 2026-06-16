/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../../../rule/hooks/use-suggest-rule-detection.hook';
import { DebtSettlementPill } from '../../../../transaction/components/debt-settlement-pill/debt-settlement-pill';
import { SimpleQuickForm } from '../../../../transaction/components/simple-quick-form/simple-quick-form';
import { TransactionCardSelector } from '../../../../transaction/components/transaction-card/transaction-card.selector';
import { UpdateTransactionActionsMenu } from '../../../../transaction/components/update-transaction-actions-menu/update-transaction-actions-menu';
import { useUpdateIncomeTransactionActions } from '../../../../transaction/hook/use-update-income-transaction-actions.hook';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { buildIncomeEntry } from '../../../../transaction/utils/build-income-entry.util';
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

const getIncomeAmountTopContent = (transaction: UpdateTransactionFormPropsInterface['transaction'], accountTitle: string | null) => (
    <DebtSettlementPill accountTitle={accountTitle} testID={TransactionCardSelector.DebtSettlementMetadata(transaction.id)} />
);

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

const UpdateIncomeForm = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const { markForEmbedding } = useEmbeddingGenerator();

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: IncomeTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void markForEmbedding(transactionId)
    });

    const toAccountId = useWatch({ control: form.control, name: 'toAccountId' });
    const { feeActionLabel, handleFeePress, quickFormRef } = useFeeHeaderAction(form.control);

    const ruleDetection = useSuggestRuleDetection({
        transaction,
        control: form.control
    });

    const handleGoBack = () => void goBackOrReplace('/');
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const isConsolidated = isDefined(transaction.consolidationType);
    const actions = useUpdateIncomeTransactionActions({
        form,
        transaction,
        transactionId,
        toAccountId
    });
    const refundConvertProps =
        !isConsolidated && !isDefined(transaction.consolidationParentTransactionId)
            ? { onConvertToRefund: actions.handleOpenRefundConvert }
            : {};
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: actions.handleOpenConvert } : {};
    const debtSettlementProps =
        categoryEntries.length === 1 && !actions.hasDebtSettlement ? { onAttachDebtSettlement: actions.handleOpenDebtSettlement } : {};
    const detachDebtSettlementProps = actions.hasDebtSettlement ? { onDetachDebtSettlement: actions.handleDetachDebtSettlement } : {};

    return (
        <FormProvider {...form}>
            <FullPage
                header={
                    <PageHeader
                        title={t`Edit Income`}
                        onGoBack={handleGoBack}
                        right={
                            <UpdateTransactionActionsMenu
                                onDelete={handleDelete}
                                isConsolidated={isConsolidated}
                                onRevert={actions.handleRevert}
                                onFeePress={handleFeePress}
                                feeActionLabel={feeActionLabel}
                                {...debtSettlementProps}
                                {...detachDebtSettlementProps}
                                {...refundConvertProps}
                                {...transferConvertProps}
                            />
                        }
                    />
                }
            >
                <SimpleQuickForm
                    ref={quickFormRef}
                    variant="positive"
                    transactionType={TransactionTypeEnum.INCOME}
                    accountFieldName="toAccountId"
                    transactionTitle={transaction.title}
                    mccCategoryId={categoryEntries.at(0)?.mccCategoryId ?? null}
                    amountTopContent={getIncomeAmountTopContent(transaction, actions.debtSettlementAccountTitle)}
                    buildEntries={buildIncomeEntry}
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
export default function UpdateIncomeTransactionPage() {
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

    return <UpdateIncomeForm transaction={transaction} transactionId={transactionId} />;
}
/* jscpd:ignore-end */
