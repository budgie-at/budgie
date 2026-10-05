import { Stack } from 'expo-router';
import { View } from 'react-native';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { TransactionFeeModalContent } from '../transaction/components/transaction-fee-modal-content/transaction-fee-modal-content';
import { useTransactionFeeModal, useTransactionFeeModalParams } from '../transaction/context/transaction-fee-modal.context';

export default function TransactionFeeModal() {
    const [, resolveTransactionFee] = useTransactionFeeModal();
    const currentParams = useTransactionFeeModalParams();
    const screenOptions = useModalRouteState(currentParams, resolveTransactionFee, null);

    if (!currentParams) {
        return null;
    }

    return (
        <View className="bg-primary-reverse" collapsable={false}>
            <Stack.Screen options={screenOptions} />
            <TransactionFeeModalContent
                accountId={currentParams.accountId}
                currencySymbol={currentParams.currencySymbol}
                entry={currentParams.entry}
                variant={currentParams.variant}
                onConfirm={resolveTransactionFee}
            />
        </View>
    );
}
