import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isPositiveNumber } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { transactionService } from '../../service/transaction.service';
import { TransactionFormAccountSelector } from '../transaction-form-account-selector/transaction-form-account-selector';
import { TransactionFormAmount } from '../transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../transaction-form-category/transaction-form-category';
import { TransactionFormComment } from '../transaction-form-comment/transaction-form-comment';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';
import { TransactionFormMetadataFields } from '../transaction-form-meta-fields/transaction-form-meta-fields';

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
    const entries = useWatch({ control: form.control, name: 'entries' });
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

    return (
        <TransactionFormLayout
            title={t`New Expense`}
            description={t`Select Category`}
            icon={UserIconNameEnum.TrendingDown}
            variant="destructive"
            buttonText={t`Add Expense`}
            onSubmit={handleSubmit}
        >
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-7xl" showsVerticalScrollIndicator={false}>
                <TransactionFormAmount setValue={form.setValue} instrumentSymbol={instrumentSymbol} control={form.control} variant="destructive" />

                <FormLayoutGroup>
                    <TransactionFormAccountSelector
                        control={form.control}
                        setValue={form.setValue}
                        entries={entries}
                        variant="destructive"
                        fieldName="fromAccountId"
                    />

                    <TransactionFormCategory
                        transactionType={TransactionTypeEnum.EXPENSE}
                        accountId={fromAccountId ?? 0}
                        setValue={form.setValue}
                        control={form.control}
                        variant="destructive"
                    />

                    <TransactionFormMetadataFields control={form.control} variant="destructive" />

                    <TransactionFormComment control={form.control} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </TransactionFormLayout>
    );
};
