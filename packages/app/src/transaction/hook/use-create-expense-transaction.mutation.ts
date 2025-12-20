import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useSettingsContext } from '../../settings/context/settings.context';
import { transactionService } from '../service/transaction.service';
import { createTransactionEntryInput } from '../utils/create-transaction-entry-input.util';
import { createTransactionInput } from '../utils/create-transaction-input.util';

export const useCreateExpenseTransactionMutation = () => {
    const { t } = useLingui();
    const { defaultInstrument, defaultAccount } = useSettingsContext();

    return async (amount: number, categoryId: number) => {
        const accountId = defaultAccount?.id ?? 0;
        const instrumentId = defaultAccount?.instrumentId ?? defaultInstrument.id;

        const transactionData = createTransactionInput({
            exchangeRate: 1,
            fromAccountId: accountId,
            toAccountId: null,
            type: TransactionTypeEnum.EXPENSE,
            entries: [
                createTransactionEntryInput({
                    accountId,
                    type: TransactionEntryTypeEnum.CREDIT,
                    instrumentId,
                    amount,
                    categoryId
                })
            ]
        });

        try {
            await transactionService.createInternal(transactionData);
            Toast.show({
                type: 'success',
                text1: t`Expense created`,
                text2: t`Your expense has been recorded successfully.`
            });
            router.back();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong.`,
                text2: t`Could not create transaction. Please try again later.`
            });
        }
    };
};
