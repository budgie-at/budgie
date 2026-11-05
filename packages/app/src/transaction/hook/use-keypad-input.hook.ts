import { useAtomValue } from '@effect/atom-react/Hooks';
import { useState } from 'react';

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
    const numericValue = Number.parseFloat(inputValue) || 0;

    const commit = (nextDisplayValue: string) => {
        const nextNumericValue = Number.parseFloat(nextDisplayValue) || 0;

        setInputValue(nextDisplayValue);

        if (nextNumericValue !== numericValue) {
            onChange?.(nextNumericValue);
        }
    };

    const handleDigit = (digit: string) => {
        if (inputValue === '0') {
            commit(digit);

            return;
        }

        const [, decimalPart] = inputValue.split('.');

        if (isDefined(decimalPart) && decimalPart.length >= maxDecimals) {
            return;
        }

        commit(inputValue + digit);
    };

    const handleDecimal = () => {
        if (!inputValue.includes('.')) {
            commit(`${inputValue}.`);
        }
    };

    const handleBackspace = () => {
        commit(inputValue.length <= 1 ? '0' : inputValue.slice(0, -1));
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
