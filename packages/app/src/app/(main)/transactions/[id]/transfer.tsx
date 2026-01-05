/* eslint-disable react/no-multi-comp */
/* jscpd:ignore-start */
import {
    AccountTypeEnum,
    TransactionWithRelationsEntityInterface,
    TransferTransactionCreateInputSchema,
    UserIconNameEnum
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../../@generic/component/form-layout-group/form-layout-group';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../../settings/context/settings.context';
import { TransactionFormAmountBase } from '../../../../transaction/components/transaction-form-amount/transaction-form-amount-base';
import { TransactionFormComment } from '../../../../transaction/components/transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../../../../transaction/components/transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../../../../transaction/components/transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../../../../transaction/components/transaction-form-tags-field/transaction-form-tags-field';
import { TransactionMccInfoField } from '../../../../transaction/components/transaction-mcc-info-field/transaction-mcc-info-field';
import { TransferTransactionFormAccounts } from '../../../../transaction/components/transfer-transaction-form/transfer-transaction-form-accounts';
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
    const { defaultInstrument } = useSettingsContext();

    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: transactionInput,
        schema: TransferTransactionCreateInputSchema,
        id: transactionId
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

    const handleAmountChange = (newAmount: number) => {
        form.setValue('amount', newAmount);
        form.setValue('entries.0.amount', newAmount);
        form.setValue('entries.1.amount', newAmount);
    };

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <Page
                header={
                    <PageHeader
                        title={t`Edit Transfer`}
                        description={t`Move Money`}
                        icon={UserIconNameEnum.ArrowRightLeft}
                        iconVariant="default"
                        onGoBack={handleGoBack}
                    />
                }
                footer={
                    <TransactionFormFooter
                        variant="default"
                        buttonText={t`Update Transfer`}
                        onSubmit={handleSubmit}
                        onDelete={handleDelete}
                    />
                }
            >
                <KeyboardAwareScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerClassName="pb-7xl"
                    showsVerticalScrollIndicator={false}
                >
                    <TransferTransactionFormAccounts variant="default" />

                    <TransactionFormAmountBase
                        variant="default"
                        instrumentSymbol={account?.instrument.symbol ?? defaultInstrument.symbol}
                        onAmountChange={handleAmountChange}
                    />

                    {isDefined(transaction.entries[0]?.mccCategory) ? (
                        <TransactionMccInfoField mccCategory={transaction.entries[0].mccCategory} />
                    ) : null}

                    <FormLayoutGroup>
                        <FormLayoutGroup variant="horizontal">
                            <TransactionFormDateField variant="default" />
                            <TransactionFormTagsField variant="default" />
                        </FormLayoutGroup>

                        <TransactionFormComment />
                    </FormLayoutGroup>
                </KeyboardAwareScrollView>
            </Page>
        </FormProvider>
    );
};
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function UpdateTransferTransactionPage() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { transaction, isLoading } = useGetTransactionByIdQuery(Number(id));

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    return <UpdateTransferForm transaction={transaction} transactionId={Number(id)} />;
}
/* jscpd:ignore-end */
