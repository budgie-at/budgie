import {
    ExpenseTransactionCreateEntityInterface,
    ExpenseTransactionCreateEntitySchema,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { transactionService } from '../../service/transaction.service';
import { TransactionForm } from '../transaction-form/transaction-form';

export const CreateExpenseTransaction = () => {
    const { t } = useLingui();

    const {
        control,
        handleSubmit: submit,
        formState
    } = useForm({
        mode: 'onSubmit',
        resolver: zodResolver(ExpenseTransactionCreateEntitySchema),
        defaultValues: {
            amount: 0,
            exchangeRate: 1,
            externalId: null,
            externalSource: null,
            fromAccountId: null,
            toAccountId: 0,
            operatedAt: new Date().toString(),
            type: TransactionTypeEnum.EXPENSE,
            title: '',
            comment: '',
            entries: [
                {
                    amount: 0,
                    accountId: 0,
                    categoryId: 0,
                    instrumentId: 0,
                    parentAccountId: 0,
                    parentCategoryId: 0,
                    type: TransactionEntryTypeEnum.CREDIT
                }
            ]
        }
    });

    const {errors} = formState

    console.log(JSON.stringify({ errors }, null, 4));

    const handleSubmit = async (data: ExpenseTransactionCreateEntityInterface) => {
        try {
            await transactionService.createInternal(data);
            router.back();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Error`,
                text2: t`Something went wrong`
            });
        }
    };

    return (
        <TransactionForm
            accountFieldName="fromAccountId"
            control={control}
            onSubmit={submit(handleSubmit)}
            variant="destructive"
            icon="TrendingUp"
            title={t`New Expense`}
            buttonText={t`Add Expense`}
        />
    );
};
