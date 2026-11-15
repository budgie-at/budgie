import { useState } from 'react';
import { useController } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListInputRow } from '../../../@generic/component/grouped-list-input-row/grouped-list-input-row';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { normalizeAmountDecimalSeparators } from '../../../@generic/utils/normalize-amount-decimal-separators.util';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';

import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly name: 'quantity' | 'price' | 'fee' | 'total';
    readonly label: string;
    readonly icon: UserIconType;
    readonly maxDecimals?: number;
    readonly placeholder?: string;
    readonly testID: string;
    readonly onChange?: () => void;
}

export const SecurityTradeNumberField = ({ name, label, icon, maxDecimals, placeholder = '0', testID, onChange }: Props) => {
    const { decimalSeparator } = useLocaleInfo();
    const { field } = useController<SecurityTradeFormValues, typeof name>({ name });
    const formatValue = (value: number | undefined) => (isPositiveNumber(value) ? String(value).replace('.', decimalSeparator) : '');
    const parseText = (value: string) => {
        const amount = Number(normalizeAmountDecimalSeparators(value, '.', [',']));

        return Number.isFinite(amount) ? amount : 0;
    };
    const [text, setText] = useState(() => formatValue(field.value));

    if (parseText(text) !== (field.value ?? 0)) {
        setText(formatValue(field.value));
    }

    const handleChangeText = (value: string) => {
        const getFractionLength = (input: string) => (normalizeAmountDecimalSeparators(input, '.', [',']).split('.').at(1) ?? '').length;
        const fractionLength = getFractionLength(value);

        if (isDefined(maxDecimals) && fractionLength > maxDecimals && fractionLength >= getFractionLength(text)) {
            return;
        }

        setText(value);
        field.onChange(parseText(value));
        onChange?.();
    };

    const handleBlur = () => {
        setText(text.replace(/([.,]\d*?)0+$/u, '$1').replace(/[.,]$/u, ''));
        field.onBlur();
    };

    return (
        <GroupedListInputRow
            icon={icon}
            label={label}
            value={text}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            placeholder={placeholder}
            keyboardType="decimal-pad"
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            testID={testID}
        />
    );
};
