import {
    IncomeTransactionCreateEntityInterface,
    IncomeTransactionCreateEntitySchema,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { FormProvider, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { transactionService } from '../../service/transaction.service';
import { TransactionForm } from '../transaction-form/transaction-form';
import { router } from 'expo-router';

export const CreateIncomeTransaction = () => {
    const { t } = useLingui();

    const form = useForm({
        mode: 'onSubmit',
        resolver: zodResolver(IncomeTransactionCreateEntitySchema),
        defaultValues: {
            amount: 0,
            exchangeRate: 1,
            externalId: null,
            externalSource: null,
            fromAccountId: null,
            toAccountId: 0,
            operatedAt: new Date().toString(),
            type: TransactionTypeEnum.INCOME,
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
                    type: TransactionEntryTypeEnum.DEBIT
                }
            ]
        }
    });

    const handleSubmit = async (data: IncomeTransactionCreateEntityInterface) => {
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
        <FormProvider {...form}>
            <TransactionForm
                accountFieldName="toAccountId"
                control={form.control}
                onSubmit={form.handleSubmit(handleSubmit)}
                variant="positive"
                icon="TrendingUp"
                title={t`New Income`}
                buttonText={t`Add Income`}
            />
        </FormProvider>
    );
};
