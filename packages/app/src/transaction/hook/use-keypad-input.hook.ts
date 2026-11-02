import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../@generic/constant/micro-unit-decimal-places.constant';
import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';
import { KeypadHandlersInterface } from '../interface/keypad-handlers.interface';

interface UseKeypadInputConfig {
    readonly initialValue?: number;
    readonly instrumentType?: InstrumentTypeEnum;
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

const formatInitialDisplay = (value: number, maxDecimalPlaces: number, fractionDigits: number): string => {
    const display = formatNumericDisplay(value, maxDecimalPlaces);
    const [integerPart = '0', fractionPart = ''] = display.split('.');
    const paddedFraction = fractionPart.padEnd(Math.min(fractionDigits, maxDecimalPlaces), '0');

    return display === '0' || !isNotEmptyString(paddedFraction) ? display : `${integerPart}.${paddedFraction}`;
};

export const useKeypadInput = (config: UseKeypadInputConfig = {}): UseKeypadInputResult => {
    const { initialValue = 0, instrumentType, onChange } = config;
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const maxDecimals = Math.max(decimalPlaces, 2);
    const instrumentFractionDigits = instrumentType === InstrumentTypeEnum.CRYPTO ? MICRO_UNIT_DECIMAL_PLACES : decimalPlaces;
    const initialFractionDigits = isDefined(instrumentType) ? instrumentFractionDigits : 0;
    const [displayValue, setDisplayValue] = useState(() =>
        initialValue === 0 ? '0' : formatInitialDisplay(initialValue, maxDecimals, initialFractionDigits)
    );
    const numericValue = Number.parseFloat(displayValue) || 0;

    const commit = (nextDisplayValue: string) => {
        const nextNumericValue = Number.parseFloat(nextDisplayValue) || 0;

        setDisplayValue(nextDisplayValue);

        if (nextNumericValue !== numericValue) {
            onChange?.(nextNumericValue);
        }
    };

    const handleDigit = (digit: string) => {
        if (displayValue === '0') {
            commit(digit);

            return;
        }

        const [, decimalPart] = displayValue.split('.');

        if (isDefined(decimalPart) && decimalPart.length >= maxDecimals) {
            return;
        }

        commit(displayValue + digit);
    };

    const handleDecimal = () => {
        if (!displayValue.includes('.')) {
            commit(`${displayValue}.`);
        }
    };

    const handleBackspace = () => {
        commit(displayValue.length <= 1 ? '0' : displayValue.slice(0, -1));
    };

    const setFromNumeric = (value: number) => {
        commit(value === 0 ? '0' : formatNumericDisplay(value, maxDecimals));
    };

    const handlers: KeypadHandlersInterface = {
        onDigit: handleDigit,
        onDecimal: handleDecimal,
        onBackspace: handleBackspace,
        onLongBackspace: () => {
            commit('0');
        }
    };

    return { displayValue, numericValue, handlers, setFromNumeric };
};
