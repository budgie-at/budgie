import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../../rule/hooks/use-suggest-rule-detection.hook';
import { useUpdateExpenseTransactionActions } from '../../hook/use-update-expense-transaction-actions.hook';
import { useUpdateTransactionForm } from '../../hook/use-update-transaction-form.hook';
import { buildExpenseEntry } from '../../utils/build-expense-entry.util';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateExpenseTransaction = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const { markForEmbedding } = useEmbeddingGenerator();

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: ExpenseTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void markForEmbedding(transactionId)
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
    const isConsolidated = isDefined(transaction.consolidationType);
    const { handleOpenConvert, handleOpenRefundSources, handleRevert } = useUpdateExpenseTransactionActions({
        transaction,
        transactionId,
        fromAccountId
    });
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};

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
                                {...transferConvertProps}
                            />
                        }
                    />
                }
            >
                <SimpleQuickForm
                    variant="destructive"
                    transactionType={TransactionTypeEnum.EXPENSE}
                    accountFieldName="fromAccountId"
                    transactionTitle={transaction.title}
                    mccCategoryId={categoryEntries.at(0)?.mccCategoryId ?? null}
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
            </FullPage>
        </FormProvider>
    );
};
