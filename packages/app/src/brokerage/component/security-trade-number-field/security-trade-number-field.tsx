import { useState } from 'react';
import { useController } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListInputRow } from '../../../@generic/component/grouped-list-input-row/grouped-list-input-row';
import { normalizeAmountDecimalSeparators } from '../../../@generic/utils/normalize-amount-decimal-separators.util';

import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly name: 'quantity' | 'price' | 'fee';
    readonly label: string;
    readonly icon: UserIconType;
    readonly testID: string;
}

export const SecurityTradeNumberField = ({ name, label, icon, testID }: Props) => {
    const { field } = useController<SecurityTradeFormValues, typeof name>({ name });
    const [text, setText] = useState(isPositiveNumber(field.value) ? String(field.value) : '');

    const handleChangeText = (value: string) => {
        const amount = Number(normalizeAmountDecimalSeparators(value, '.', [',']));

        setText(value);
        field.onChange(Number.isFinite(amount) ? amount : 0);
    };

    return (
        <GroupedListInputRow
            icon={icon}
            label={label}
            value={text}
            onChangeText={handleChangeText}
            onBlur={field.onBlur}
            placeholder="0"
            keyboardType="decimal-pad"
            testID={testID}
        />
    );
};
