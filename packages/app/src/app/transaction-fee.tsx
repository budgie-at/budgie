import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { TransactionFeeModalContent } from '../transaction/components/transaction-fee-modal-content/transaction-fee-modal-content';
import { useTransactionFeeModal, useTransactionFeeModalParams } from '../transaction/context/transaction-fee-modal.context';

export default function TransactionFeeModal() {
    const [, resolveTransactionFee, dismissTransactionFee] = useTransactionFeeModal();
    const currentParams = useTransactionFeeModalParams();
    const contentStyle = useResolveClassNames('bg-sheet-surface');
    const modalRouteOptions = useModalRouteState(currentParams, dismissTransactionFee);
    const screenOptions = { ...modalRouteOptions, contentStyle };

    if (!currentParams) {
        return null;
    }

    return (
        <View className="bg-sheet-surface" collapsable={false}>
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
