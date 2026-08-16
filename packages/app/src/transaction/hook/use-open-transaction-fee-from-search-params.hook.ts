import { useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { SimpleQuickFormRefInterface } from '../interface/simple-quick-form-ref.interface';

export const useOpenTransactionFeeFromSearchParams = () => {
    const { openFee } = useLocalSearchParams<{ openFee?: string }>();
    const hasOpenedFeeRef = useRef(false);
    const formRef = useRef<SimpleQuickFormRefInterface>(null);
    const handleFeePress = () => formRef.current?.openFee();
    const setFormRef = (form: SimpleQuickFormRefInterface | null) => {
        formRef.current = form;

        if (openFee === '1' && isDefined(form) && !hasOpenedFeeRef.current) {
            hasOpenedFeeRef.current = true;
            form.openFee();
        }
    };

    return { handleFeePress, setFormRef };
};
