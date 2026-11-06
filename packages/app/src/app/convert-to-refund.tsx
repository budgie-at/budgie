import { Stack } from 'expo-router';
import { View } from 'react-native';

import { useIsAccessibilityTextSize } from '../@generic/hook/use-is-accessibility-text-size.hook';
import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { ConvertToRefundContent } from '../transaction/components/convert-to-refund-content/convert-to-refund-content';
import { useConvertToRefundModal, useConvertToRefundModalParams } from '../transaction/context/convert-to-refund-modal.context';

import { ConvertToRefundModalSelector } from './convert-to-refund-modal.selector';

const EXPANDED_DETENT = 0.9;
const ACCESSIBILITY_DETENT = 1;

export default function ConvertToRefundModal() {
    const [, resolveConvertToRefund, dismissConvertToRefund] = useConvertToRefundModal();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const currentParams = useConvertToRefundModalParams();
    const screenOptions = {
        ...useModalRouteState(currentParams, dismissConvertToRefund),
        sheetAllowedDetents: isAccessibilityTextSize ? [ACCESSIBILITY_DETENT] : [EXPANDED_DETENT],
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
