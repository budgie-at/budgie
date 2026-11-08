import { useEffect, useEffectEvent, useRef } from 'react';
import { TextInput } from 'react-native';

export const useTransactionFeeAmountFocus = (isFeeActive: boolean, shouldFocusNewFee: boolean) => {
    const amountRef = useRef<TextInput>(null);
    const isReturningToFeeRef = useRef(false);

    const handleFeeActive = useEffectEvent(() => {
        if (isReturningToFeeRef.current || shouldFocusNewFee) {
            amountRef.current?.focus();
        }

        isReturningToFeeRef.current = false;
    });

    useEffect(() => {
        if (isFeeActive) {
            handleFeeActive();
        }
    }, [isFeeActive]);

    const markReturning = () => {
        isReturningToFeeRef.current = true;
    };

    return { amountRef, markReturning };
};
