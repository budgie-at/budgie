import { AccountTypeEnum, TransactionWithRelationsEntityInterface, TransferTransactionCreateInputSchema, UserIconNameEnum } from '@budgie/contracts';
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
import { useUpdateTransactionForm } from '../../hook/use-update-transaction-form.hook';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { TransactionFormAmountBase } from '../transaction-form-amount/transaction-form-amount-base';
import { TransactionFormComment } from '../transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../transaction-form-tags-field/transaction-form-tags-field';
import { TransferTransactionFormAccounts } from '../transfer-transaction-form/transfer-transaction-form-accounts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const UpdateTransferTransaction = ({ transaction }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();

    const { form, handleSubmit } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: TransferTransactionCreateInputSchema,
        id: transaction.id
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
                footer={<TransactionFormFooter variant="default" buttonText={t`Update Transfer`} onSubmit={handleSubmit} />}
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
