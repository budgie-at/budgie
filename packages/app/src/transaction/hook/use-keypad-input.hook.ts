import { useAtomValue } from '@effect/atom-react/Hooks';
import { useEffect, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';
import { KeypadHandlersInterface } from '../interface/keypad-handlers.interface';

interface UseKeypadInputConfig {
    readonly initialValue?: number;
    readonly onChange?: (value: number) => void;
}

export interface UseKeypadInputResult {
    readonly displayValue: string;
    readonly numericValue: number;
    readonly handlers: KeypadHandlersInterface;
    readonly setFromNumeric: (value: number) => void;
}

const formatNumericInput = (value: number): string => value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });

export const useKeypadInput = (config: UseKeypadInputConfig = {}): UseKeypadInputResult => {
    const { initialValue = 0, onChange } = config;
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const maxDecimals = Math.max(decimalPlaces, 2);
    const [inputValue, setInputValue] = useState(() => formatNumericInput(initialValue));
    const inputValueRef = useRef(inputValue);
    const onChangeRef = useRef(onChange);
    const numericValue = Number.parseFloat(inputValue) || 0;

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const commit = (nextDisplayValue: string) => {
        const previousNumericValue = Number.parseFloat(inputValueRef.current) || 0;
        const nextNumericValue = Number.parseFloat(nextDisplayValue) || 0;

        inputValueRef.current = nextDisplayValue;
        setInputValue(nextDisplayValue);

        if (nextNumericValue !== previousNumericValue) {
            onChangeRef.current?.(nextNumericValue);
        }
    };

    const handleDigit = (digit: string) => {
        const currentInputValue = inputValueRef.current;

        if (currentInputValue === '0') {
            commit(digit);

            return;
        }

        const [, decimalPart] = currentInputValue.split('.');

        if (isDefined(decimalPart) && decimalPart.length >= maxDecimals) {
            return;
        }

        commit(currentInputValue + digit);
    };

    const handleDecimal = () => {
        const currentInputValue = inputValueRef.current;

        if (!currentInputValue.includes('.')) {
            commit(`${currentInputValue}.`);
        }
    };

    const handleBackspace = () => {
        const currentInputValue = inputValueRef.current;

        commit(currentInputValue.length <= 1 ? '0' : currentInputValue.slice(0, -1));
    };

    const setFromNumeric = (value: number) => {
        commit(formatNumericInput(value));
    };

    const handlers: KeypadHandlersInterface = {
        onDigit: handleDigit,
        onDecimal: handleDecimal,
        onBackspace: handleBackspace,
        onLongBackspace: () => {
            commit('0');
        }
    };

    return { displayValue: inputValue, numericValue, handlers, setFromNumeric };
};
