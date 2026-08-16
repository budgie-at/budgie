import { useLocalSearchParams } from 'expo-router';
import { RefObject, useCallback, useEffect, useRef } from 'react';

import type { SimpleQuickFormRefInterface } from '../interface/simple-quick-form-ref.interface';

export const useOpenTransactionFeeFromSearchParams = (formRef: RefObject<SimpleQuickFormRefInterface | null>) => {
    const { openFee } = useLocalSearchParams<{ openFee?: string }>();
    const hasOpenedFeeRef = useRef(false);
    const handleFeePress = useCallback(() => formRef.current?.openFee(), [formRef]);

    useEffect(() => {
        if (openFee === '1' && !hasOpenedFeeRef.current) {
            hasOpenedFeeRef.current = true;
            handleFeePress();
        }
    }, [handleFeePress, openFee]);

    return handleFeePress;
};
