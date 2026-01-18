/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import {
    ExpenseTransactionCreateInputSchema,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { BlurScrollView } from '../../../../@generic/component/blur-scroll-view/blur-scroll-view';
import { FormLayoutGroup } from '../../../../@generic/component/form-layout-group/form-layout-group';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { PopoverMenuItem } from '../../../../@generic/component/popover-menu-item/popover-menu-item';
import { BottomSheetInterface } from '../../../../@generic/interface/bottom-sheet.interface';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../../settings/context/settings.context';
import { ConvertExpenseToTransferBottomSheet } from '../../../../transaction/components/convert-expense-to-transfer-bottom-sheet/convert-expense-to-transfer-bottom-sheet';
import {
    TransactionActionsMenu,
    useTransactionActionsMenu
} from '../../../../transaction/components/transaction-actions-menu/transaction-actions-menu';
import { TransactionFormAccountSelector } from '../../../../transaction/components/transaction-form-account-selector/transaction-form-account-selector';
import { TransactionFormAmount } from '../../../../transaction/components/transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../../../../transaction/components/transaction-form-category/transaction-form-category';
import { TransactionFormComment } from '../../../../transaction/components/transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../../../../transaction/components/transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../../../../transaction/components/transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../../../../transaction/components/transaction-form-tags-field/transaction-form-tags-field';
import { TransactionMccInfoField } from '../../../../transaction/components/transaction-mcc-info-field/transaction-mcc-info-field';
import { useUpdateTransactionForm } from '../../../../transaction/hook/use-update-transaction-form.hook';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { convertTransactionToInput } from '../../../../transaction/utils/convert-transaction-to-input.util';

interface UpdateExpenseFormProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
}

interface ConvertToTransferMenuItemProps {
    readonly onConvert: () => void;
}

const ConvertToTransferMenuItem = ({ onConvert }: ConvertToTransferMenuItemProps) => {
    const { t } = useLingui();
    const closeMenu = useTransactionActionsMenu();

    const handlePress = () => {
        closeMenu();
        onConvert();
    };

    return <PopoverMenuItem icon={UserIconNameEnum.ArrowRightLeft} label={t`Convert to Transfer`} onPress={handlePress} />;
};
/* jscpd:ignore-end */

/* jscpd:ignore-start */
const UpdateExpenseForm = ({ transaction, transactionId }: UpdateExpenseFormProps) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();

    const convertSheetRef = useRef<BottomSheetInterface | null>(null);

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: ExpenseTransactionCreateInputSchema,
        id: transactionId
    });

    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const instrumentSymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    const handleGoBack = () => void goBackOrReplace('/');

    const handleOpenConvert = () => void convertSheetRef.current?.open();

    return (
        <>
            <FormProvider {...form}>
                <Page
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
                    footer={<TransactionFormFooter variant="destructive" buttonText={t`Update Expense`} onSubmit={handleSubmit} />}
                    withBlur
                >
                    <BlurScrollView>
                        <TransactionFormAmount instrumentSymbol={instrumentSymbol} variant="destructive" />

                        {isDefined(transaction.entries[0]?.mccCategory) ? (
                            <TransactionMccInfoField mccCategory={transaction.entries[0].mccCategory} />
                        ) : null}

                        <FormLayoutGroup>
                            <TransactionFormAccountSelector variant="destructive" fieldName="fromAccountId" />

                            <TransactionFormCategory
                                transactionType={TransactionTypeEnum.EXPENSE}
                                accountId={fromAccountId ?? 0}
                                variant="destructive"
                            />

                            <FormLayoutGroup variant="horizontal">
                                <TransactionFormDateField variant="destructive" />
                                <TransactionFormTagsField variant="destructive" />
                            </FormLayoutGroup>

                            <TransactionFormComment />
                        </FormLayoutGroup>
                    </BlurScrollView>
                </Page>
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
