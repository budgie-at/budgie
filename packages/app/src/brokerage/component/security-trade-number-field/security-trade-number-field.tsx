import { useState } from 'react';
import { useController } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListInputRow } from '../../../@generic/component/grouped-list-input-row/grouped-list-input-row';
import { normalizeAmountDecimalSeparators } from '../../../@generic/utils/normalize-amount-decimal-separators.util';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';

import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly name: 'quantity' | 'price' | 'fee';
    readonly label: string;
    readonly icon: UserIconType;
    readonly maxDecimals?: number;
    readonly placeholder?: string;
    readonly testID: string;
}

export const SecurityTradeNumberField = ({ name, label, icon, maxDecimals, placeholder = '0', testID }: Props) => {
    const { decimalSeparator } = useLocaleInfo();
    const { field } = useController<SecurityTradeFormValues, typeof name>({ name });
    const formatValue = (value: number) => (isPositiveNumber(value) ? String(value).replace('.', decimalSeparator) : '');
    const parseText = (value: string) => {
        const amount = Number(normalizeAmountDecimalSeparators(value, '.', [',']));

        return Number.isFinite(amount) ? amount : 0;
    };
    const [text, setText] = useState(() => formatValue(field.value));

    if (parseText(text) !== field.value) {
        setText(formatValue(field.value));
    }

    const handleChangeText = (value: string) => {
        const fraction = normalizeAmountDecimalSeparators(value, '.', [',']).split('.').at(1) ?? '';

        if (isDefined(maxDecimals) && fraction.length > maxDecimals) {
            return;
        }

        setText(value);
        field.onChange(parseText(value));
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
            testID={testID}
        />
    );
};
