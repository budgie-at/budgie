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

import { useSettingsContext } from '../../../settings/context/settings.context';
import { transactionService } from '../../service/transaction.service';
import { TransactionForm } from '../transaction-form/transaction-form';

export const CreateExpenseTransaction = () => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();

    const {
        control,
        handleSubmit: submit,
        setValue
    } = useForm({
        mode: 'onSubmit',
        resolver: zodResolver(ExpenseTransactionCreateEntitySchema),
        defaultValues: {
            amount: 0,
            exchangeRate: 1,
            externalId: null,
            externalSource: null,
            fromAccountId: 0,
            toAccountId: null,
            operatedAt: new Date().toString(),
            type: TransactionTypeEnum.EXPENSE,
            title: '',
            comment: '',
            entries: [
                {
                    amount: 0,
                    accountId: 0,
                    categoryId: 0,
                    instrumentId: defaultInstrument.id,
                    type: TransactionEntryTypeEnum.CREDIT
                }
            ]
        }
    });

    const handleSubmit = async (data: ExpenseTransactionCreateEntityInterface) => {
        try {
            await transactionService.createInternal(data);
            router.back();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong.`,
                text2: t`Could not create transaction. Please try again later.`
            });
        }
    };

    return (
        <TransactionForm
            accountFieldName="fromAccountId"
            control={control}
            setValue={setValue}
            onSubmit={submit(handleSubmit)}
            variant="destructive"
            icon="TrendingUp"
            title={t`New Expense`}
            buttonText={t`Add Expense`}
        />
    );
};
