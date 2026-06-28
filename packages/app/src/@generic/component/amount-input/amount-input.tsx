import { ComponentProps, useRef, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

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
    readonly commitOnBlur?: boolean;
    readonly valuePrefix?: string;
    readonly minimumDecimalPlaces?: number;
    readonly onChangeValue: (value: number) => void;
}

const parseAmountText = (text: string, decimalSeparator: string, digitGroupingSeparator: string, visibleDecimalPlaces: number) => {
    const cleaned = sanitizeAmountText(text, decimalSeparator, digitGroupingSeparator, visibleDecimalPlaces);

    if (!isNotEmptyString(cleaned)) {
        return null;
    }

    const normalizedNumeric = normalizeDecimalSeparator(cleaned, decimalSeparator);
    const { integerPart, decimalPart, hasDecimal } = extractPartsFromNumeric(normalizedNumeric, visibleDecimalPlaces);
    const displayValue = hasDecimal ? `${integerPart}${decimalSeparator}${decimalPart}` : integerPart;
    const parsedValue = parseFloat(normalizedNumeric) || 0;

    return { displayValue, parsedValue };
};

export const AmountInput = ({
    value,
    onChangeValue,
    inputClassName,
    status,
    autoFocus,
    commitOnBlur = false,
    selectTextOnFocus = false,
    valuePrefix = '',
    minimumDecimalPlaces = 0,
    ...rest
}: Props) => {
    const { decimalSeparator, digitGroupingSeparator } = useLocaleInfo();
    const { decimalPlaces } = useSettingsContext();
    const visibleDecimalPlaces = Math.max(decimalPlaces, minimumDecimalPlaces);
    const formatDigits = useFormatDigits(visibleDecimalPlaces);
    const { intl } = useI18nContext();

    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [selection, setSelection] = useState<NonNullable<ComponentProps<typeof Input>['selection']> | null>(null);
    const pendingValueRef = useRef(value);

    const displayedText = isFocused ? displayValue : formatDigits(value === 0 ? '' : value.toString(), valuePrefix);

    const handleChangeText = (text: string) => {
        setSelection(null);

        const parsedAmount = parseAmountText(text, decimalSeparator, digitGroupingSeparator, visibleDecimalPlaces);

        if (!isDefined(parsedAmount)) {
            setDisplayValue('');
            pendingValueRef.current = 0;

            if (!commitOnBlur) {
                onChangeValue(0);
            }

            return;
        }

        setDisplayValue(parsedAmount.displayValue);
        pendingValueRef.current = parsedAmount.parsedValue;

        if (!commitOnBlur) {
            onChangeValue(parsedAmount.parsedValue);
        }
    };

    const handleFocus = () => {
        const editableText =
            value === 0
                ? ''
                : intl.formatNumber(value, {
                      useGrouping: false,
                      maximumFractionDigits: visibleDecimalPlaces
                  });

        setIsFocused(true);
        setDisplayValue(editableText);
        pendingValueRef.current = value;

        const editableTextEnd = editableText.length;
        const selectionStart = selectTextOnFocus ? 0 : editableTextEnd;

        setSelection({ start: selectionStart, end: editableTextEnd });
    };

    const handleBlur = () => {
        setIsFocused(false);
        setDisplayValue('');
        setSelection(null);

        if (commitOnBlur) {
            onChangeValue(pendingValueRef.current);
        }
    };

    const selectionProps = isDefined(selection) ? { selection } : {};

    return (
        <Input
            status={status}
            value={displayedText}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            keyboardType="decimal-pad"
            submitBehavior="submit"
            autoFocus={autoFocus}
            selectTextOnFocus={selectTextOnFocus}
            className={inputClassName}
            {...rest}
            {...selectionProps}
        />
    );
};
