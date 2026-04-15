/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import {
    AccountTypeEnum,
    TransactionEntryTypeEnum,
    TransactionWithRelationsEntityInterface,
    TransferTransactionCreateInputSchema
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param-interface.type';
import { convertFromMicroUnits } from '../../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { TransferQuickForm } from '../../../../transaction/components/transfer-quick-form/transfer-quick-form';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

interface UpdateTransferFormProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
}
/* jscpd:ignore-end */

/* jscpd:ignore-start */
const UpdateTransferForm = ({ transaction, transactionId }: UpdateTransferFormProps) => {
    const { t } = useLingui();
    const { generateForTransaction } = useEmbeddingGenerator();

    const transactionInput = convertTransactionToInput(transaction);

    const debitEntry = transaction.entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
    const initialDestinationAmount = isDefined(debitEntry) ? convertFromMicroUnits(debitEntry.amount) : 0;

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: TransferTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: data =>
            void generateForTransaction({
                title: data.title,
                comment: data.comment,
                mccCategoryId: data.entries[0]?.mccCategoryId ?? null,
                categoryId: data.entries[0]?.categoryId ?? null,
                tagIds: data.tagIds
            })
    });

    const [fromAccountId, amount] = useWatch({
        control: form.control,
        name: ['fromAccountId', 'amount']
    });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { balance } = useAccountBalanceQuery(fromAccountId ?? 0);

    const isDebtAccount = account?.type === AccountTypeEnum.DEBT;
    const exceedsDebtBalance = isDebtAccount && amount > balance;

    useEffect(() => {
        if (exceedsDebtBalance) {
            form.setError('amount', { type: 'custom', message: t`Amount exceeds debt account balance` });
        } else {
            form.clearErrors('amount');
        }
    }, [exceedsDebtBalance, form, t]);

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <FullPage
                header={
                    <PageHeader
                        title={t`Edit Transfer`}
                        onGoBack={handleGoBack}
                        right={<TransactionActionsMenu onDelete={handleDelete} />}
                    />
                }
            >
                <TransferQuickForm
                    variant="default"
                    initialDestinationAmount={initialDestinationAmount}
                    onSubmit={handleSubmit}
                    onCancel={handleGoBack}
                />
            </FullPage>
        </FormProvider>
    );
};
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function UpdateTransferTransactionPage() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { transaction, isLoading } = useGetTransactionByIdQuery(Number(id));

    if (isLoading) {
        return null;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    return <UpdateTransferForm transaction={transaction} transactionId={Number(id)} />;
}
/* jscpd:ignore-end */
