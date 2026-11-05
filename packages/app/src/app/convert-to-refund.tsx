import { Stack } from 'expo-router';
import { View } from 'react-native';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { ConvertToRefundContent } from '../transaction/components/convert-to-refund-content/convert-to-refund-content';
import { useConvertToRefundModal, useConvertToRefundModalParams } from '../transaction/context/convert-to-refund-modal.context';

import { ConvertToRefundModalSelector } from './convert-to-refund-modal.selector';

const COMPACT_DETENT = 0.62;
const EXPANDED_DETENT = 0.9;

export default function ConvertToRefundModal() {
    const [, resolveConvertToRefund, dismissConvertToRefund] = useConvertToRefundModal();
    const currentParams = useConvertToRefundModalParams();
    const screenOptions = {
        ...useModalRouteState(currentParams, dismissConvertToRefund),
        sheetAllowedDetents: [COMPACT_DETENT, EXPANDED_DETENT],
        sheetInitialDetentIndex: 0
    };
    const refundIncomeTransactionId = currentParams?.refundIncomeTransactionId ?? 0;

    if (!currentParams) {
        return null;
    }

    return (
        <View className="flex-1 bg-grouped-surface" collapsable={false} testID={ConvertToRefundModalSelector.Page}>
            <Stack.Screen options={screenOptions} />
            <ConvertToRefundContent refundIncomeTransactionId={refundIncomeTransactionId} resolveConvertToRefund={resolveConvertToRefund} />
        </View>
    );
}
