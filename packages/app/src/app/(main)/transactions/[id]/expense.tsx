/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { convertFromMicroUnits } from '../../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { ConvertToTransferMenuItem } from '../../../../transaction/components/convert-to-transfer-menu-item/convert-to-transfer-menu-item';
import { SimpleQuickForm } from '../../../../transaction/components/simple-quick-form/simple-quick-form';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { useConvertToTransferModal } from '../../../../transaction/context/convert-to-transfer-modal.context';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { buildExpenseEntry } from '../../../../transaction/utils/build-expense-entry.util';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

interface UpdateExpenseFormProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
}
/* jscpd:ignore-end */

/* jscpd:ignore-start */
const UpdateExpenseForm = ({ transaction, transactionId }: UpdateExpenseFormProps) => {
    const { t } = useLingui();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const { generateForTransaction } = useEmbeddingGenerator();

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: ExpenseTransactionCreateInputSchema,
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

    const fromAccountId = form.watch('fromAccountId');

    const handleGoBack = () => void goBackOrReplace('/');
    const [sourceEntry] = transaction.entries;
    const sourceAmount = sourceEntry.amount;
    const sourceAccount = sourceEntry.account;
    const sourceInstrumentId = sourceAccount.instrumentId;
    const mccCategoryId = sourceEntry.mccCategoryId ?? null;

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
                            <TransactionActionsMenu onDelete={handleDelete}>
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
