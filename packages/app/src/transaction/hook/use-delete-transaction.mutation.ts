import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { transactionService } from '../service/transaction.service';

export const useDeleteTransactionMutation = () => {
    const { t } = useLingui();

    const deleteTransaction = async (id: number) => {
        try {
            await transactionService.deleteById(id);
            Toast.show({
                type: 'success',
                text1: t`Transaction deleted`,
                text2: t`The transaction has been removed successfully.`
            });
            router.back();
        } catch (_error) {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong.`,
                text2: t`Could not delete transaction. Please try again later.`
            });
        }
    };

    const confirmDelete = (id: number) => {
        Alert.alert(t`Delete Transaction`, t`Are you sure you want to delete this transaction? This action cannot be undone.`, [
            {
                text: t`Cancel`,
                style: 'cancel'
            },
            {
                text: t`Delete`,
                onPress: () => void deleteTransaction(id),
                style: 'destructive'
            }
        ]);
    };

    return { confirmDelete };
};
