import React, { useState } from 'react';
import { TextInput } from 'react-native';

import { isEmptyString, isNotEmptyString } from '@rnw-community/shared';

import { useFormatDigits } from '../../hooks/use-format-digits.hook';
import { useLocaleInfo } from '../../hooks/use-locale-info.hook';
import { extractPartsFromNumeric } from '../../utils/extract-parts-from-numeric.util';
import { groupNumericByThousands } from '../../utils/group-numeric-by-thousands.util';
import { normalizeDecimalSeparator } from '../../utils/normalize-decimal-separator.util';
import { sanitizeAmountText } from '../../utils/sanitize-amount-text.util';

interface Props {
    readonly value: number;
    readonly placeholder?: string;
    readonly inputClassName?: string;
    readonly onChangeValue: (value: number) => void;
}

export const AmountInput = ({ value, onChangeValue, inputClassName, placeholder }: Props) => {
    const formatDigits = useFormatDigits();
    const localeInfo = useLocaleInfo();

    const [displayValue, setDisplayValue] = useState(formatDigits(value === 0 ? '' : value.toString()));

    const handleChangeText = (text: string) => {
        const { decimalSeparator, digitGroupingSeparator } = localeInfo;
        const cleaned = sanitizeAmountText(text, decimalSeparator, digitGroupingSeparator);

        if (isEmptyString(cleaned)) {
            setDisplayValue('');
            onChangeValue(0);

            return;
        }

        const normalizedNumeric = normalizeDecimalSeparator(cleaned, decimalSeparator);

        const { integerPart, decimalPart, hasDecimal } = extractPartsFromNumeric(normalizedNumeric);

        const formattedInteger = groupNumericByThousands(integerPart, digitGroupingSeparator);

        const displayValue = hasDecimal ? `${formattedInteger}${decimalSeparator}${decimalPart}` : formattedInteger;

        setDisplayValue(displayValue);
        onChangeValue(parseFloat(normalizedNumeric) || 0);
    };

    const handleBlur = () => {
        if (!isNotEmptyString(displayValue)) {
            return;
        }

        const cleaned = displayValue.split(localeInfo.digitGroupingSeparator).join('').replace(localeInfo.decimalSeparator, '.');

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
