/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { convertFromMicroUnits } from '../../../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../../../@generic/utils/dismiss-all-or-replace.util';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../../../rule/hooks/use-suggest-rule-detection.hook';
import { ConvertToTransferMenuItem } from '../../../../transaction/components/convert-to-transfer-menu-item/convert-to-transfer-menu-item';
import { RefundedPill } from '../../../../transaction/components/refunded-pill/refunded-pill';
import { SimpleQuickForm } from '../../../../transaction/components/simple-quick-form/simple-quick-form';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { useConsolidationSourceModal } from '../../../../transaction/context/consolidation-source-modal.context';
import { useConvertToTransferModal } from '../../../../transaction/context/convert-to-transfer-modal.context';
import { useRevertConsolidation } from '../../../../transaction/hook/use-revert-consolidation.hook';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { buildExpenseEntry } from '../../../../transaction/utils/build-expense-entry.util';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

import type { UpdateTransactionFormPropsInterface } from '../../../../transaction/interface/update-transaction-form-props.interface';
/* jscpd:ignore-end */

/* jscpd:ignore-start */

const UpdateExpenseForm = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const { markForEmbedding } = useEmbeddingGenerator();

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: ExpenseTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void markForEmbedding({ transactionId })
    });

    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' });

    const {
        mode: ruleDetectionMode,
        suggestRuleData,
        updateRuleData,
        matchingRulesCount,
        matchingRuleIds,
        onRuleCreated,
        onDismiss,
        onCreatingChange
    } = useSuggestRuleDetection({
        transaction,
        control: form.control
    });

    const handleGoBack = () => void goBackOrReplace('/');
    const [sourceEntry] = transaction.entries;
    const sourceAccount = sourceEntry.account;
    const isConsolidated = isDefined(transaction.consolidationType);
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));

    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId });

    const handleOpenConvert = () =>
        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.EXPENSE,
            excludeAccountId: fromAccountId ?? 0,
            sourceAmount: convertFromMicroUnits(sourceEntry.amount),
            sourceInstrumentId: sourceAccount.instrumentId,
            sourceCode: sourceAccount.instrument.code
        });

    return (
        <FormProvider {...form}>
            <FullPage
                header={
                    <PageHeader
                        title={t`Edit Expense`}
                        onGoBack={handleGoBack}
                        right={
                            <TransactionActionsMenu
                                onDelete={handleDelete}
                                isConsolidated={isConsolidated}
                                {...(isConsolidated && { onRevert: handleRevert })}
                            >
                                <ConvertToTransferMenuItem onConvert={handleOpenConvert} />
                            </TransactionActionsMenu>
                        }
                    />
                }
            >
                <SimpleQuickForm
                    variant="destructive"
                    transactionType={TransactionTypeEnum.EXPENSE}
                    accountFieldName="fromAccountId"
                    transactionTitle={transaction.title}
                    mccCategoryId={sourceEntry.mccCategoryId ?? null}
                    amountTopContent={<RefundedPill transaction={transaction} onPress={handleOpenRefundSources} />}
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
            </FullPage>
        </FormProvider>
    );
};
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function UpdateExpenseTransactionPage() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { transaction, isLoading } = useGetTransactionByIdQuery(Number(id));

    if (isLoading) {
        return null;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    return <UpdateExpenseForm transaction={transaction} transactionId={Number(id)} />;
}
/* jscpd:ignore-end */
