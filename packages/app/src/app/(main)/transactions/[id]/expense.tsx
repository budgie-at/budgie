/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import {
    ExpenseTransactionCreateInputSchema,
    PRECISION,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { ConvertToTransferMenuItem } from '../../../../transaction/components/convert-to-transfer-menu-item/convert-to-transfer-menu-item';
import { ExpenseQuickForm } from '../../../../transaction/components/expense-quick-form/expense-quick-form';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { useConvertToTransferModal } from '../../../../transaction/context/convert-to-transfer-modal.context';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

interface UpdateExpenseFormProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
}
/* jscpd:ignore-end */

/* jscpd:ignore-start */
const UpdateExpenseForm = ({ transaction, transactionId }: UpdateExpenseFormProps) => {
    const { t } = useLingui();
    const { openConvertToTransfer } = useConvertToTransferModal();

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: ExpenseTransactionCreateInputSchema,
        id: transactionId
    });

    const fromAccountId = form.watch('fromAccountId');

    const handleGoBack = () => void goBackOrReplace('/');
    const [sourceEntry] = transaction.entries;
    const sourceAmount = sourceEntry.amount;
    const sourceAccount = sourceEntry.account;
    const sourceInstrumentId = sourceAccount.instrumentId;

    const handleOpenConvert = () =>
        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.EXPENSE,
            excludeAccountId: fromAccountId ?? 0,
            sourceAmount: sourceAmount / PRECISION,
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
                            <TransactionActionsMenu onDelete={handleDelete}>
                                <ConvertToTransferMenuItem onConvert={handleOpenConvert} />
                            </TransactionActionsMenu>
                        }
                    />
                }
            >
                <ExpenseQuickForm variant="destructive" onSubmit={handleSubmit} onCancel={handleGoBack} />
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
        return <LoadingScreen />;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    return <UpdateExpenseForm transaction={transaction} transactionId={Number(id)} />;
}
/* jscpd:ignore-end */
