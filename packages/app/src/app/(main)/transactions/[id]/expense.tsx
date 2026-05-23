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
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../../../rule/hooks/use-suggest-rule-detection.hook';
import { RefundedPill } from '../../../../transaction/components/refunded-pill/refunded-pill';
import { SimpleQuickForm } from '../../../../transaction/components/simple-quick-form/simple-quick-form';
import { UpdateTransactionActionsMenu } from '../../../../transaction/components/update-transaction-actions-menu/update-transaction-actions-menu';
import { useUpdateExpenseTransactionActions } from '../../../../transaction/hook/use-update-expense-transaction-actions.hook';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { buildExpenseEntry } from '../../../../transaction/utils/build-expense-entry.util';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

import type { UpdateTransactionFormPropsInterface } from '../../../../transaction/interface/update-transaction-form-props.interface';
/* jscpd:ignore-end */

/* jscpd:ignore-start */

const UpdateExpenseForm = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
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
    const isConsolidated = isDefined(transaction.consolidationType);
    const { handleOpenConvert, handleOpenRefundSources, handleRevert } = useUpdateExpenseTransactionActions({
        transaction,
        transactionId,
        fromAccountId
    });

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
                                onConvertToTransfer={handleOpenConvert}
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
