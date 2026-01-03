import {
    AccountTypeEnum,
    ExpenseTransactionCreateInputSchema,
    TransactionCreateInputInterface,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Controller, UseControllerReturn, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isPositiveNumber } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { transactionService } from '../../service/transaction.service';
import { TransactionFormAmount } from '../transaction-form/transaction-form.amount';
import { TransactionFormCategory } from '../transaction-form/transaction-form.category';
import { TransactionFormComment } from '../transaction-form/transaction-form.comment';
import { TransactionFormMetadata } from '../transaction-form/transaction-form.metadata';
import { TransactionFormRoot } from '../transaction-form/transaction-form.root';

const EXCLUDED_ACCOUNT_TYPES = [AccountTypeEnum.DEBT];

interface Props {
    readonly categoryId?: number;
    readonly amount?: number;
    readonly accountId?: number | null;
}

export const CreateExpenseTransaction = ({ categoryId, amount, accountId }: Props) => {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternal(data),
        schema: ExpenseTransactionCreateInputSchema,
        fromAccountId: accountId ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null,
        amount,
        categoryId
    });

    const entries = useWatch({ control: form.control, name: 'entries' });

    const handleAccountChange = (newAccountId: number) => {
        form.setValue('fromAccountId', newAccountId);
        entries.forEach((_, index) => {
            form.setValue(`entries.${index}.accountId`, newAccountId);
        });
    };

    const renderAccountSelector = ({
        field: { value },
        fieldState: { error, invalid }
    }: UseControllerReturn<TransactionCreateInputInterface, 'fromAccountId'>) => {
        const status = invalid ? 'error' : 'default';

        return (
            <FormItem label={t`Account`} error={error?.message}>
                <AccountSelector
                    status={status}
                    variant="destructive"
                    accountId={value}
                    onSelect={handleAccountChange}
                    excludeAccountTypes={EXCLUDED_ACCOUNT_TYPES}
                    emptyStateDescription={t`Create your first account to start tracking transactions`}
                />
            </FormItem>
        );
    };

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
        <TransactionFormRoot
            form={form}
            variant="destructive"
            title={t`New Expense`}
            description={t`Select Category`}
            icon={UserIconNameEnum.TrendingDown}
            buttonText={t`Add Expense`}
            onSubmit={handleSubmit}
        >
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-7xl" showsVerticalScrollIndicator={false}>
                <TransactionFormAmount />

                <FormLayoutGroup>
                    <Controller render={renderAccountSelector} name="fromAccountId" control={form.control} />

                    <TransactionFormCategory transactionType={TransactionTypeEnum.EXPENSE} />

                    <TransactionFormMetadata />

                    <TransactionFormComment />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </TransactionFormRoot>
    );
};
