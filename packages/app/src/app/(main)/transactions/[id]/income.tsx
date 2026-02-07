/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import {
    IncomeTransactionCreateInputSchema,
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
import { useEmbeddingGenerator } from '../../../../ai/hook/use-embedding-generator.hook';
import { ConvertToTransferMenuItem } from '../../../../transaction/components/convert-to-transfer-menu-item/convert-to-transfer-menu-item';
import { SimpleQuickForm } from '../../../../transaction/components/simple-quick-form/simple-quick-form';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { useConvertToTransferModal } from '../../../../transaction/context/convert-to-transfer-modal.context';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { buildIncomeEntry } from '../../../../transaction/utils/build-income-entry.util';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

interface UpdateIncomeFormProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
}
/* jscpd:ignore-end */

/* jscpd:ignore-start */
const UpdateIncomeForm = ({ transaction, transactionId }: UpdateIncomeFormProps) => {
    const { t } = useLingui();
    const { openConvertToTransfer } = useConvertToTransferModal();
    const { generateForTransaction } = useEmbeddingGenerator();

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: IncomeTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: data => void generateForTransaction(data.title, data.comment, data.entries[0]?.mccCategoryId ?? null)
    });

    const toAccountId = form.watch('toAccountId');

    const handleGoBack = () => void goBackOrReplace('/');
    const [sourceEntry] = transaction.entries;
    const sourceAmount = sourceEntry.amount;
    const sourceAccount = sourceEntry.account;
    const sourceInstrumentId = sourceAccount.instrumentId;
    const mccCategoryId = sourceEntry.mccCategoryId ?? null;

    const handleOpenConvert = () =>
        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.INCOME,
            excludeAccountId: toAccountId ?? 0,
            sourceAmount: sourceAmount / PRECISION,
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
                            <TransactionActionsMenu onDelete={handleDelete}>
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
        return <LoadingScreen />;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    return <UpdateIncomeForm transaction={transaction} transactionId={Number(id)} />;
}
/* jscpd:ignore-end */
