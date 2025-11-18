import React, { useState } from 'react';
import { TextInput } from 'react-native';

import { isEmptyString, isNotEmptyString } from '@rnw-community/shared';

import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useFormatDigits } from '../../hooks/use-format-digits.hook';
import { extractPartsFromNumeric } from '../../utils/extract-parts-from-numeric.util';
import { normalizeDecimalSeparator } from '../../utils/normalize-decimal-separator.util';
import { sanitizeAmountText } from '../../utils/sanitize-amount-text.util';

interface Props {
    readonly value: number;
    readonly placeholder?: string;
    readonly inputClassName?: string;
    readonly onChangeValue: (value: number) => void;
}

export const AmountInput = ({ value, onChangeValue, inputClassName, placeholder }: Props) => {
    const { decimalSeparator, digitGroupingSeparator } = useLocaleInfo();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { intl } = useI18nContext();

    const [displayValue, setDisplayValue] = useState(formatDigits(value === 0 ? '' : value.toString()));

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

    const handleBlur = () => {
        if (!isNotEmptyString(displayValue)) {
            return;
        }

        const cleaned = displayValue.split(digitGroupingSeparator).join('').replace(decimalSeparator, '.');

        const formatted = formatDigits(cleaned);

        setDisplayValue(formatted);
    };

    return (
        <TextInput
            value={displayValue}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            placeholder={placeholder}
            keyboardType="decimal-pad"
            className={inputClassName}
        />
    );
};
