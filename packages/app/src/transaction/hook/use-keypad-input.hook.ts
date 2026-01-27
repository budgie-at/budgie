import { useCallback, useEffect, useRef, useState } from 'react';

import { useSettingsContext } from '../../settings/context/settings.context';

interface UseKeypadInputConfig {
    readonly initialValue?: number;
    readonly onChange?: (value: number) => void;
}

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

// eslint-disable-next-line max-lines-per-function -- Hook manages keypad state with multiple handlers
export const useKeypadInput = (config: UseKeypadInputConfig = {}): UseKeypadInputResult => {
    const { initialValue = 0, onChange } = config;
    const { decimalPlaces } = useSettingsContext();
    const [displayValue, setDisplayValue] = useState(() => (initialValue === 0 ? '0' : initialValue.toString()));
    const isInitialMount = useRef(true);

    const numericValue = parseFloat(displayValue) || 0;

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;

            return;
        }

        onChange?.(numericValue);
    }, [numericValue, onChange]);

    const handleDigit = useCallback(
        (digit: string) => {
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
        },
        [decimalPlaces]
    );

    const handleDecimal = useCallback(() => {
        setDisplayValue(prev => {
            if (prev.includes('.')) {
                return prev;
            }

            return `${prev}.`;
        });
    }, []);

    const handleDoubleZero = useCallback(() => {
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
    }, [decimalPlaces]);

    const handleBackspace = useCallback(() => {
        setDisplayValue(prev => {
            if (prev.length <= 1) {
                return '0';
            }

            return prev.slice(0, -1);
        });
    }, []);

    const handleClear = useCallback(() => {
        setDisplayValue('0');
    }, []);

    const setFromNumeric = useCallback((value: number) => {
        const newDisplay = value === 0 ? '0' : value.toString();

        setDisplayValue(newDisplay);
    }, []);

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
