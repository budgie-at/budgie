import { useAtomValue } from '@effect/atom-react/Hooks';
import { useEffect, useRef, useState } from 'react';

import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';
import { KeypadHandlersInterface } from '../interface/keypad-handlers.interface';

interface UseKeypadInputConfig {
    readonly initialValue?: number;
    readonly onChange?: (value: number) => void;
}

interface UseKeypadInputResult {
    readonly displayValue: string;
    readonly numericValue: number;
    readonly handlers: KeypadHandlersInterface;
    readonly setFromNumeric: (value: number) => void;
}

const formatNumericDisplay = (value: number, maxDecimalPlaces: number): string => {
    const rounded = Number.parseFloat(value.toFixed(maxDecimalPlaces));

    return rounded.toString();
};

export const useKeypadInput = (config: UseKeypadInputConfig = {}): UseKeypadInputResult => {
    const { initialValue = 0, onChange } = config;
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const maxDecimals = Math.max(decimalPlaces, 2);
    const [displayValue, setDisplayValue] = useState(() => (initialValue === 0 ? '0' : formatNumericDisplay(initialValue, maxDecimals)));
    const isInitialMount = useRef(true);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const numericValue = Number.parseFloat(displayValue) || 0;

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;

            return;
        }

        onChangeRef.current?.(numericValue);
    }, [numericValue]);

    const handleDigit = (digit: string) => {
        setDisplayValue(prev => {
            if (prev === '0') {
                return digit;
            }

            const parts = prev.split('.');
            const hasDecimal = parts.length > 1;
            const decimalPart = parts[1] ?? '';

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

    const handleBackspace = () => {
        setDisplayValue(prev => {
            if (prev.length <= 1) {
                return '0';
            }

            return prev.slice(0, -1);
        });
    };

    const setFromNumeric = (value: number) => {
        const newDisplay = value === 0 ? '0' : formatNumericDisplay(value, maxDecimals);

        setDisplayValue(newDisplay);
    };

    const handlers: KeypadHandlersInterface = {
        onDigit: handleDigit,
        onDecimal: handleDecimal,
        onBackspace: handleBackspace,
        onLongBackspace: () => {
            setDisplayValue('0');
        }
    };

    return { displayValue, numericValue, handlers, setFromNumeric };
};
