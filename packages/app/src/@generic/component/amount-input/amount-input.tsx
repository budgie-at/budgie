import React, { ComponentProps, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

import { emptyFn, isDefined, isEmptyString, isNotEmptyString } from '@rnw-community/shared';

import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { FormFieldStatus } from '../../type/form-field-status.type';
import { extractPartsFromNumeric } from '../../utils/extract-parts-from-numeric.util';
import { normalizeDecimalSeparator } from '../../utils/normalize-decimal-separator.util';
import { sanitizeAmountText } from '../../utils/sanitize-amount-text.util';
import { Input } from '../input/input';

import type { TextInput } from 'react-native';

interface Props extends Omit<ComponentProps<typeof Input>, 'value'> {
    readonly value: number;
    readonly inputClassName?: string;
    readonly status?: FormFieldStatus;
    readonly autoFocus?: boolean;
    readonly valuePrefix?: string;
    readonly minimumDecimalPlaces?: number;
    readonly onChangeValue: (value: number) => void;
}

export const AmountInput = ({
    value,
    onChangeValue,
    inputClassName,
    status,
    autoFocus,
    valuePrefix = '',
    minimumDecimalPlaces = 0,
    ...rest
}: Props) => {
    const { decimalSeparator, digitGroupingSeparator } = useLocaleInfo();
    const { decimalPlaces } = useSettingsContext();
    const visibleDecimalPlaces = Math.max(decimalPlaces, minimumDecimalPlaces);
    const formatDigits = useFormatDigits(visibleDecimalPlaces);
    const { intl } = useI18nContext();

    const inputRef = useRef<TextInput>(null);
    const [displayValue, setDisplayValue] = useState(() => formatDigits(value === 0 ? '' : value.toString(), valuePrefix));
    const [isFocused, setIsFocused] = useState(false);

    const displayedText = isFocused ? displayValue : formatDigits(value === 0 ? '' : value.toString(), valuePrefix);

    useEffect(() => {
        if (!autoFocus) {
            return emptyFn;
        }

        const interactionHandle = InteractionManager.runAfterInteractions(() => {
            if (isDefined(inputRef.current)) {
                inputRef.current.focus();
            }
        });

        return () => void interactionHandle.cancel();
    }, [autoFocus]);

    const handleChangeText = (text: string) => {
        const cleaned = sanitizeAmountText(text, decimalSeparator, digitGroupingSeparator);

        if (isEmptyString(cleaned)) {
            setDisplayValue('');
            onChangeValue(0);

            return;
        }

        const normalizedNumeric = normalizeDecimalSeparator(cleaned, decimalSeparator);

        const { integerPart, decimalPart, hasDecimal } = extractPartsFromNumeric(normalizedNumeric);

        const formattedInteger = isNotEmptyString(integerPart)
            ? intl.formatNumber(Number(integerPart), { useGrouping: true, maximumFractionDigits: 0 })
            : '';

        const displayValue = hasDecimal ? `${formattedInteger}${decimalSeparator}${decimalPart}` : formattedInteger;

        setDisplayValue(displayValue);
        onChangeValue(parseFloat(normalizedNumeric) || 0);
    };

    const handleFocus = () => {
        setIsFocused(true);
        setDisplayValue(displayedText);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setDisplayValue('');
    };

    return (
        <Input
            status={status}
            value={displayedText}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            keyboardType="decimal-pad"
            ref={inputRef}
            className={inputClassName}
            {...rest}
        />
    );
};
