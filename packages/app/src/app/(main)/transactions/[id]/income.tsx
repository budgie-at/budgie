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
import { convertFromMicroUnits } from '../../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../../../rule/hooks/use-suggest-rule-detection.hook';
import { ConvertToTransferMenuItem } from '../../../../transaction/components/convert-to-transfer-menu-item/convert-to-transfer-menu-item';
import { SimpleQuickForm } from '../../../../transaction/components/simple-quick-form/simple-quick-form';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { useConvertToTransferModal } from '../../../../transaction/context/convert-to-transfer-modal.context';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { buildIncomeEntry } from '../../../../transaction/utils/build-income-entry.util';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

import type { UpdateTransactionFormPropsInterface } from '../../../../transaction/interface/update-transaction-form-props.interface';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
const UpdateIncomeForm = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const { markForEmbedding } = useEmbeddingGenerator();

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: IncomeTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void markForEmbedding({ transactionId })
    });

    const toAccountId = useWatch({ control: form.control, name: 'toAccountId' });

    const {
        mode: ruleDetectionMode,
        suggestRuleData,
        updateRuleData,
        matchingRulesCount,
        onRuleCreated,
        onDismiss,
        onCreatingChange
    } = useSuggestRuleDetection({
        transaction,
        control: form.control
    });

    const handleGoBack = () => void goBackOrReplace('/');
    const [sourceEntry] = transaction.entries;
    const sourceAmount = sourceEntry.amount;
    const sourceAccount = sourceEntry.account;
    const sourceInstrumentId = sourceAccount.instrumentId;
    const mccCategoryId = sourceEntry.mccCategoryId ?? null;
    const isConsolidated = isDefined(transaction.consolidationType);

    const handleOpenConvert = () =>
        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.INCOME,
            excludeAccountId: toAccountId ?? 0,
            sourceAmount: convertFromMicroUnits(sourceAmount),
            sourceInstrumentId,
            sourceCode: sourceAccount.instrument.code
        });

    return (
        <FormProvider {...form}>
            <FullPage
                header={
                    <PageHeader
                        title={t`Edit Income`}
                        onGoBack={handleGoBack}
                        right={
                            <TransactionActionsMenu onDelete={handleDelete} isConsolidated={isConsolidated}>
                                <ConvertToTransferMenuItem onConvert={handleOpenConvert} />
                            </TransactionActionsMenu>
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
export default function UpdateIncomeTransactionPage() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { transaction, isLoading } = useGetTransactionByIdQuery(Number(id));

    if (isLoading) {
        return null;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    return <UpdateIncomeForm transaction={transaction} transactionId={Number(id)} />;
}
/* jscpd:ignore-end */
