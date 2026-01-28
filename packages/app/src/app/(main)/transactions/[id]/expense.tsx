/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { FormProvider } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { BottomSheetInterface } from '../../../../@generic/interface/bottom-sheet.interface';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { ConvertExpenseToTransferBottomSheet } from '../../../../transaction/components/convert-expense-to-transfer-bottom-sheet/convert-expense-to-transfer-bottom-sheet';
import { ConvertToTransferMenuItem } from '../../../../transaction/components/convert-to-transfer-menu-item/convert-to-transfer-menu-item';
import { ExpenseQuickForm } from '../../../../transaction/components/expense-quick-form/expense-quick-form';
import { TransactionActionsMenu } from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
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
    const convertSheetRef = useRef<BottomSheetInterface | null>(null);

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: ExpenseTransactionCreateInputSchema,
        id: transactionId
    });

    const fromAccountId = form.watch('fromAccountId');

    const handleGoBack = () => void goBackOrReplace('/');
    const handleOpenConvert = () => void convertSheetRef.current?.open();

    return (
        <>
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
                    <ExpenseQuickForm variant="destructive" onSubmit={handleSubmit} />
                </FullPage>
            </FormProvider>
            <ConvertExpenseToTransferBottomSheet ref={convertSheetRef} transactionId={transactionId} fromAccountId={fromAccountId ?? 0} />
        </>
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
