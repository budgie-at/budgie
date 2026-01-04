/* jscpd:ignore-start */
import { AccountTypeEnum, TransactionTypeEnum, TransferTransactionCreateInputSchema, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { SystemCategoryIdEnum } from '../../../category/enum/system-category-id.enum';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionFormAmountBase } from '../../../transaction/components/transaction-form-amount/transaction-form-amount-base';
import { TransactionFormComment } from '../../../transaction/components/transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../../../transaction/components/transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../../../transaction/components/transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../../../transaction/components/transaction-form-tags-field/transaction-form-tags-field';
import { TransferTransactionFormAccounts } from '../../../transaction/components/transfer-transaction-form/transfer-transaction-form-accounts';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
import { transactionService } from '../../../transaction/service/transaction.service';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function CreateTransferTransactionPage() {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const { accountId } = useLocalSearchParams<{ accountId?: string }>();

    const parsedAccountId = isDefined(accountId) && isPositiveNumber(Number(accountId)) ? Number(accountId) : null;

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternalTransfer(data),
        categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
        schema: TransferTransactionCreateInputSchema,
        type: TransactionTypeEnum.TRANSFER,
        fromAccountId: parsedAccountId ?? 0,
        toAccountId: 0
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
                        title={t`New Transfer`}
                        description={t`Move Money`}
                        icon={UserIconNameEnum.ArrowRightLeft}
                        iconVariant="default"
                        onGoBack={handleGoBack}
                    />
                }
                footer={<TransactionFormFooter variant="default" buttonText={t`Add Transfer`} onSubmit={handleSubmit} />}
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
                        autoFocus
                    />

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
}
/* jscpd:ignore-end */
