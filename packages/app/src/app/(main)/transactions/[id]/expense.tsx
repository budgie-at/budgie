/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { convertFromMicroUnits } from '../../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { useFormatDigits } from '../../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../../settings/context/settings.context';
import { ConvertToTransferMenuItem } from '../../../../transaction/components/convert-to-transfer-menu-item/convert-to-transfer-menu-item';
import { RefundedPill } from '../../../../transaction/components/refunded-pill/refunded-pill';
import { SimpleQuickForm } from '../../../../transaction/components/simple-quick-form/simple-quick-form';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { useConsolidationSourceModal } from '../../../../transaction/context/consolidation-source-modal.context';
import { useConvertToTransferModal } from '../../../../transaction/context/convert-to-transfer-modal.context';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { buildExpenseEntry } from '../../../../transaction/utils/build-expense-entry.util';
import { computeRefundedSummary } from '../../../../transaction/utils/compute-refunded-summary.util';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

import type { UpdateTransactionFormPropsInterface } from '../../../../transaction/interface/update-transaction-form-props.interface';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
const UpdateExpenseForm = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const { markForEmbedding } = useEmbeddingGenerator();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: ExpenseTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void markForEmbedding({ transactionId })
    });

    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' });

    const handleGoBack = () => void goBackOrReplace('/');
    const [sourceEntry] = transaction.entries;
    const sourceAmount = sourceEntry.amount;
    const sourceAccount = sourceEntry.account;
    const sourceInstrumentId = sourceAccount.instrumentId;
    const mccCategoryId = sourceEntry.mccCategoryId ?? null;
    const isConsolidated = isDefined(transaction.consolidationType);

    const refundSummary = computeRefundedSummary(transaction);
    const refundCurrencySymbol = sourceAccount.instrument.symbol;
    const refundedAmountProp =
        isDefined(refundSummary) && refundSummary.kind === 'partial' && isNotEmptyString(refundCurrencySymbol)
            ? { formattedRefundedAmount: formatDigits(convertFromMicroUnits(refundSummary.refundsTotal), refundCurrencySymbol) }
            : {};

    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId });

    const headerBottom = isDefined(refundSummary) ? (
        <View className="flex-row">
            <RefundedPill kind={refundSummary.kind} {...refundedAmountProp} onPress={handleOpenRefundSources} />
        </View>
    ) : null;

    const handleOpenConvert = () =>
        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.EXPENSE,
            excludeAccountId: fromAccountId ?? 0,
            sourceAmount: convertFromMicroUnits(sourceAmount),
            sourceInstrumentId,
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
                            <TransactionActionsMenu onDelete={handleDelete} isConsolidated={isConsolidated}>
                                <ConvertToTransferMenuItem onConvert={handleOpenConvert} />
                            </TransactionActionsMenu>
                        }
                        bottom={headerBottom}
                    />
                }
            >
                <SimpleQuickForm
                    variant="destructive"
                    transactionType={TransactionTypeEnum.EXPENSE}
                    accountFieldName="fromAccountId"
                    transactionTitle={transaction.title}
                    mccCategoryId={mccCategoryId}
                    buildEntries={buildExpenseEntry}
                    onSubmit={handleSubmit}
                    onCancel={handleGoBack}
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
