import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isPositiveNumber } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { transactionService } from '../../service/transaction.service';
import { TransactionFormAccountSelector } from '../transaction-form-account-selector/transaction-form-account-selector';
import { TransactionFormAmount } from '../transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../transaction-form-category/transaction-form-category';
import { TransactionFormComment } from '../transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../transaction-form-tags-field/transaction-form-tags-field';

interface Props {
    readonly categoryId?: number;
    readonly amount?: number;
    readonly accountId?: number | null;
}

export const CreateExpenseTransaction = ({ categoryId, amount, accountId }: Props) => {
    const { t } = useLingui();
    const { defaultAccount, defaultInstrument } = useSettingsContext();

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternal(data),
        schema: ExpenseTransactionCreateInputSchema,
        fromAccountId: accountId ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null,
        amount,
        categoryId
    });

    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const instrumentSymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    useEffect(() => {
        if (isPositiveNumber(amount)) {
            form.setValue('amount', amount);
        }
    }, [amount, form]);

    useEffect(() => {
        if (isPositiveNumber(categoryId)) {
            form.setValue('entries.0.categoryId', categoryId);
        }
    }, [categoryId, form]);

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <Page
                header={
                    <PageHeader
                        title={t`New Expense`}
                        description={t`Select Category`}
                        icon={UserIconNameEnum.TrendingDown}
                        iconVariant="destructive"
                        onGoBack={handleGoBack}
                    />
                }
                footer={<TransactionFormFooter variant="destructive" buttonText={t`Add Expense`} onSubmit={handleSubmit} />}
            >
                <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-7xl" showsVerticalScrollIndicator={false}>
                    <TransactionFormAmount instrumentSymbol={instrumentSymbol} variant="destructive" />

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
                </KeyboardAwareScrollView>
            </Page>
        </FormProvider>
    );
};
