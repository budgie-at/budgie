/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../../../rule/hooks/use-suggest-rule-detection.hook';
import { SimpleQuickForm } from '../../../../transaction/components/simple-quick-form/simple-quick-form';
import { UpdateTransactionActionsMenu } from '../../../../transaction/components/update-transaction-actions-menu/update-transaction-actions-menu';
import { useUpdateIncomeTransactionActions } from '../../../../transaction/hook/use-update-income-transaction-actions.hook';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { buildIncomeEntry } from '../../../../transaction/utils/build-income-entry.util';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';
import { getTransactionCategoryEntries } from '../../../../transaction/utils/get-transaction-category-entries.util';
import { getTransactionHref } from '../../../../transaction/utils/get-transaction-href.util';

import type { UpdateTransactionFormPropsInterface } from '../../../../transaction/interface/update-transaction-form-props.interface';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
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

    const ruleDetection = useSuggestRuleDetection({
        transaction,
        control: form.control
    });

    const handleGoBack = () => void goBackOrReplace('/');
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const isConsolidated = isDefined(transaction.consolidationType);
    const {
        handleOpenConvert,
        handleOpenRefundConvert,
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        handleRevert,
        hasDebtSettlement
    } = useUpdateIncomeTransactionActions({
        transaction,
        transactionId,
        toAccountId
    });
    const canConvertToRefund = !isConsolidated && !isDefined(transaction.consolidationParentTransactionId);
    const refundConvertProps = canConvertToRefund ? { onConvertToRefund: handleOpenRefundConvert } : {};
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};
    const debtSettlementProps =
        categoryEntries.length === 1 && !hasDebtSettlement
            ? { onAttachDebtSettlement: handleOpenDebtSettlement, attachDebtSettlementLabel: t`Attach debt return` }
            : {};
    const detachDebtSettlementProps = hasDebtSettlement ? { onDetachDebtSettlement: handleDetachDebtSettlement } : {};

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
                                onRevert={handleRevert}
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
                    variant="positive"
                    transactionType={TransactionTypeEnum.INCOME}
                    accountFieldName="toAccountId"
                    transactionTitle={transaction.title}
                    mccCategoryId={categoryEntries.at(0)?.mccCategoryId ?? null}
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
