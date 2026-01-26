import { useState } from 'react';

import { useSettingsContext } from '../../settings/context/settings.context';

interface UseKeypadInputResult {
    readonly displayValue: string;
    readonly numericValue: number;
    readonly handleDigit: (digit: string) => void;
    readonly handleDecimal: () => void;
    readonly handleDoubleZero: () => void;
    readonly handleBackspace: () => void;
    readonly handleClear: () => void;
    readonly setFromNumeric: (value: number) => void;
}

export const useKeypadInput = (initialValue = 0): UseKeypadInputResult => {
    const { decimalPlaces } = useSettingsContext();
    const [displayValue, setDisplayValue] = useState(() => (initialValue === 0 ? '0' : initialValue.toString()));

    const numericValue = parseFloat(displayValue) || 0;

    const handleDigit = (digit: string) => {
        setDisplayValue(prev => {
            if (prev === '0') {
                return digit;
            }

            const parts = prev.split('.');
            const hasDecimal = parts.length > 1;
            const decimalPart = parts[1] ?? '';
            const maxDecimals = Math.max(decimalPlaces, 2);

            if (hasDecimal && decimalPart.length >= maxDecimals) {
                return prev;
            }

            return prev + digit;
        });
    };

    const handleDecimal = () => {
        setDisplayValue(prev => {
            if (prev.includes('.')) {
                return prev;
            }

            return `${prev}.`;
        });
    };

    const handleDoubleZero = () => {
        setDisplayValue(prev => {
            if (prev === '0') {
                return prev;
            }

            const parts = prev.split('.');
            const hasDecimal = parts.length > 1;
            const decimalPart = parts[1] ?? '';
            const maxDecimals = Math.max(decimalPlaces, 2);

            if (hasDecimal) {
                const remainingDecimals = maxDecimals - decimalPart.length;

                if (remainingDecimals >= 2) {
                    return `${prev}00`;
                }

                if (remainingDecimals === 1) {
                    return `${prev}0`;
                }

                return prev;
            }

            return `${prev}00`;
        });
    };

    const handleBackspace = () => {
        setDisplayValue(prev => {
            if (prev.length <= 1) {
                return '0';
            }

            return prev.slice(0, -1);
        });
    };

    const handleClear = () => {
        setDisplayValue('0');
    };

    const setFromNumeric = (value: number) => {
        setDisplayValue(value === 0 ? '0' : value.toString());
    };

    return {
        displayValue,
        numericValue,
        handleDigit,
        handleDecimal,
        handleDoubleZero,
        handleBackspace,
        handleClear,
        setFromNumeric
    };
};
