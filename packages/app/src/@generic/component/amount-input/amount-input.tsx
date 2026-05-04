import React, { ComponentProps, useState } from 'react';

import { isEmptyString, isNotEmptyString } from '@rnw-community/shared';

import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { FormFieldStatus } from '../../type/form-field-status.type';
import { extractPartsFromNumeric } from '../../utils/extract-parts-from-numeric.util';
import { normalizeDecimalSeparator } from '../../utils/normalize-decimal-separator.util';
import { sanitizeAmountText } from '../../utils/sanitize-amount-text.util';
import { Input } from '../input/input';

interface Props extends Omit<ComponentProps<typeof Input>, 'value'> {
    readonly value: number;
    readonly inputClassName?: string;
    readonly status?: FormFieldStatus;
    readonly autoFocus?: boolean;
    readonly valuePrefix?: string;
    readonly onChangeValue: (value: number) => void;
}

export const AmountInput = ({ value, onChangeValue, inputClassName, status, autoFocus, valuePrefix = '', ...rest }: Props) => {
    const { decimalSeparator, digitGroupingSeparator } = useLocaleInfo();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { intl } = useI18nContext();

    const [displayValue, setDisplayValue] = useState(() => formatDigits(value === 0 ? '' : value.toString(), valuePrefix));
    const [isFocused, setIsFocused] = useState(false);

    const displayedText = isFocused ? displayValue : formatDigits(value === 0 ? '' : value.toString(), valuePrefix);

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
            autoFocus={autoFocus}
            className={inputClassName}
            {...rest}
        />
    );
};
