import {
    IncomeTransactionCreateEntityInterface,
    IncomeTransactionCreateEntitySchema,
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

export const CreateIncomeTransaction = () => {
    const { t } = useLingui();
    const { defaultInstrument, defaultAccount } = useSettingsContext();

    const form = useForm({
        mode: 'onSubmit',
        resolver: zodResolver(IncomeTransactionCreateEntitySchema),
        defaultValues: {
            tagIds: [],
            amount: 0,
            exchangeRate: 1,
            externalId: null,
            externalSource: null,
            fromAccountId: null,
            toAccountId: defaultAccount?.id ?? 0,
            operatedAt: new Date(),
            type: TransactionTypeEnum.INCOME,
            title: '',
            comment: '',
            entries: [
                {
                    amount: 0,
                    categoryId: 0,
                    accountId: defaultAccount?.id ?? 0,
                    instrumentId: defaultInstrument.id,
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
                text1: t`Something went wrong.`,
                text2: t`Could not create transaction. Please try again later.`
            });
        }
    };

    return (
        <TransactionForm
            accountFieldName="toAccountId"
            control={form.control}
            onSubmit={form.handleSubmit(handleSubmit)}
            setValue={form.setValue}
            variant="positive"
            icon="TrendingUp"
            title={t`New Income`}
            buttonText={t`Add Income`}
        />
    );
};
