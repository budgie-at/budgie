import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { ConvertToRefundContent } from '../transaction/components/convert-to-refund-content/convert-to-refund-content';
import { useConvertToRefundModal } from '../transaction/context/convert-to-refund-modal.context';

import { ConvertToRefundModalSelector } from './convert-to-refund-modal.selector';

export default function ConvertToRefundModal() {
    const router = useRouter();
    const [, resolveConvertToRefund, currentParams] = useConvertToRefundModal();
    const resolveConvertToRefundRef = useRef(resolveConvertToRefund);
    const hadParamsRef = useRef(false);
    const { backgroundColor } = useFormsheetListStyles();
    const refundIncomeTransactionId = currentParams?.refundIncomeTransactionId ?? 0;
    const screenOptions = { contentStyle: { backgroundColor } };
    const containerStyle = { flex: 1, backgroundColor };

    useEffect(() => {
        resolveConvertToRefundRef.current = resolveConvertToRefund;
    }, [resolveConvertToRefund]);

    useEffect(() => () => void resolveConvertToRefundRef.current(null, { skipBack: true }), []);

    useEffect(() => {
        if (currentParams) {
            hadParamsRef.current = true;
        }

        if (!currentParams && !hadParamsRef.current && router.canGoBack()) {
            router.back();
        }
    }, [currentParams, router]);

    if (!currentParams) {
        return null;
    }

    return (
        <View style={containerStyle} collapsable={false} testID={ConvertToRefundModalSelector.Page}>
            <Stack.Screen options={screenOptions} />
            <ConvertToRefundContent refundIncomeTransactionId={refundIncomeTransactionId} resolveConvertToRefund={resolveConvertToRefund} />
        </View>
    );
}
