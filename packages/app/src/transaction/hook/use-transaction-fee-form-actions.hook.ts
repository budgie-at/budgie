import { useEffect, useRef } from 'react';

import type { SimpleQuickFormRefInterface } from '../interface/simple-quick-form-ref.interface';

export const useTransactionFeeFormActions = (openFeeOnMount = false) => {
    const formRef = useRef<SimpleQuickFormRefInterface>(null);
    const hasOpenedFeeRef = useRef(false);
    const handleFeePress = () => formRef.current?.openFee();

    useEffect(() => {
        if (openFeeOnMount && !hasOpenedFeeRef.current) {
            hasOpenedFeeRef.current = true;
            formRef.current?.openFee();
        }
    }, [openFeeOnMount]);

    return { formRef, handleFeePress };
};
