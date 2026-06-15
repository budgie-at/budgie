import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../../rule/hooks/use-suggest-rule-detection.hook';
import { useUpdateIncomeTransactionActions } from '../../hook/use-update-income-transaction-actions.hook';
import { useUpdateTransactionForm } from '../../hook/use-update-transaction-form.hook';
import { buildIncomeEntry } from '../../utils/build-income-entry.util';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateIncomeTransaction = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const { markForEmbedding } = useEmbeddingGenerator();

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: IncomeTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void markForEmbedding(transactionId)
    });

    const toAccountId = useWatch({ control: form.control, name: 'toAccountId' });

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
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const mccCategoryId = categoryEntries.at(0)?.mccCategoryId ?? null;
    const isConsolidated = isDefined(transaction.consolidationType);
    const { handleOpenConvert, handleOpenRefundConvert, handleRevert } = useUpdateIncomeTransactionActions({
        transaction,
        transactionId,
        toAccountId
    });
    const canConvertToRefund = !isConsolidated && !isDefined(transaction.consolidationParentTransactionId);
    const refundConvertProps = canConvertToRefund ? { onConvertToRefund: handleOpenRefundConvert } : {};
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};

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
                    mccCategoryId={mccCategoryId}
                    buildEntries={buildIncomeEntry}
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
