import { AccountTypeEnum, TransactionTypeEnum, TransferTransactionCreateInputSchema, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { SystemCategoryIdEnum } from '../../../category/enum/system-category-id.enum';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { transactionService } from '../../service/transaction.service';
import { TransactionFormAmountBase } from '../transaction-form-amount/transaction-form-amount-base';
import { TransactionFormComment } from '../transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../transaction-form-tags-field/transaction-form-tags-field';
import { TransferTransactionFormAccounts } from '../transfer-transaction-form/transfer-transaction-form-accounts';

interface Props {
    readonly accountId?: number | null;
}

export const CreateTransferTransaction = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternalTransfer(data),
        categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
        schema: TransferTransactionCreateInputSchema,
        type: TransactionTypeEnum.TRANSFER,
        fromAccountId: accountId ?? 0,
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
};
