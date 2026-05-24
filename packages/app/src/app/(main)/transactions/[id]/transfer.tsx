/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import { AccountTypeEnum, TransactionEntryTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { convertFromMicroUnits } from '../../../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../../../@generic/utils/dismiss-all-or-replace.util';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { TransferQuickForm } from '../../../../transaction/components/transfer-quick-form/transfer-quick-form';
import { useConsolidationSourceModal } from '../../../../transaction/context/consolidation-source-modal.context';
import { useRevertConsolidation } from '../../../../transaction/hook/use-revert-consolidation.hook';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';
import { getTransactionHref } from '../../../../transaction/utils/get-transaction-href.util';

import type { UpdateTransactionFormPropsInterface } from '../../../../transaction/interface/update-transaction-form-props.interface';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
const UpdateTransferForm = ({ transaction, transactionId }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const { markForEmbedding } = useEmbeddingGenerator();
    const [openConsolidationSource] = useConsolidationSourceModal();

    const transactionInput = convertTransactionToInput(transaction);

    const debitEntry = transaction.entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
    const initialDestinationAmount = isDefined(debitEntry) ? convertFromMicroUnits(debitEntry.amount) : 0;
    const isConsolidated = isDefined(transaction.consolidationType);
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: TransferTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void markForEmbedding({ transactionId })
    });

    const [fromAccountId, amount] = useWatch({
        control: form.control,
        name: ['fromAccountId', 'amount']
    });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { balance } = useAccountBalanceQuery(fromAccountId ?? 0);

    const isDebtAccount = account?.type === AccountTypeEnum.DEBT;
    const exceedsDebtBalance = isDebtAccount && amount > balance;

    const handleConsolidationPress = () => {
        void openConsolidationSource({ transactionId });
    };
    const handleGoBack = () => void goBackOrReplace('/');

    useEffect(() => {
        if (exceedsDebtBalance) {
            form.setError('amount', { type: 'custom', message: t`Amount exceeds debt account balance` });
        } else {
            form.clearErrors('amount');
        }
    }, [exceedsDebtBalance, form, t]);

    return (
        <FormProvider {...form}>
            <FullPage
                header={
                    <PageHeader
                        title={t`Edit Transfer`}
                        onGoBack={handleGoBack}
                        right={
                            <TransactionActionsMenu
                                onDelete={handleDelete}
                                isConsolidated={isConsolidated}
                                {...(isConsolidated && { onRevert: handleRevert })}
                            />
                        }
                    />
                }
            >
                <TransferQuickForm
                    variant="default"
                    initialDestinationAmount={initialDestinationAmount}
                    onSubmit={handleSubmit}
                    onCancel={handleGoBack}
                    {...(isConsolidated && { onConsolidationPress: handleConsolidationPress })}
                />
            </FullPage>
        </FormProvider>
    );
};
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function UpdateTransferTransactionPage() {
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
        if (isParentLoading) {
            return null;
        }

        return isDefined(parentTransaction) ? <Redirect href={getTransactionHref(parentTransaction)} /> : <Redirect href="/" />;
    }

    return <UpdateTransferForm transaction={transaction} transactionId={transactionId} />;
}
/* jscpd:ignore-end */
