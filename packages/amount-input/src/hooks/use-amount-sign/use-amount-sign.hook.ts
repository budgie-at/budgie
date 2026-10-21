import { useState } from 'react';

import { applyAmountSign } from '../../utils/apply-amount-sign/apply-amount-sign.util';
import { resolveIsNegativeAmount } from '../../utils/resolve-is-negative-amount/resolve-is-negative-amount.util';

import type { UseAmountSignResultInterface } from '../../interface/use-amount-sign-result.interface';

export const useAmountSign = (value: number, onChange: (value: number) => void): UseAmountSignResultInterface => {
    const [isNegative, setIsNegative] = useState(value < 0);
    const [previousValue, setPreviousValue] = useState(value);
    const absoluteValue = Math.abs(value);

    if (value !== previousValue) {
        setPreviousValue(value);
        setIsNegative(resolveIsNegativeAmount(isNegative, value));
    }

    const toggleSign = () => {
        setIsNegative(!isNegative);

        if (absoluteValue !== 0) {
            onChange(applyAmountSign(absoluteValue, !isNegative));
        }
    };

    const changeAbsoluteValue = (nextAbsoluteValue: number) => void onChange(applyAmountSign(nextAbsoluteValue, isNegative));

    return { isNegative, absoluteValue, toggleSign, changeAbsoluteValue };
};
