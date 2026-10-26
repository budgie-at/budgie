import { useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { formatEditableAmount } from '../../utils/format-editable-amount/format-editable-amount.util';
import { parseAmountText } from '../../utils/parse-amount-text/parse-amount-text.util';

import type { AmountInputPropsInterface } from '../../interface/amount-input-props.interface';
import type { UseAmountInputOptionsInterface } from '../../interface/use-amount-input-options.interface';
import type { BlurEvent, FocusEvent, TextInputProps } from 'react-native';

export const useAmountInput = (options: UseAmountInputOptionsInterface): AmountInputPropsInterface => {
    const { value, format, onChangeValue, commitOnBlur = false, selectTextOnFocus = false, onFocus, onBlur } = options;

    const [editableText, setEditableText] = useState<string | null>(null);
    const [selection, setSelection] = useState<TextInputProps['selection'] | null>(null);
    const pendingValueRef = useRef(value);

    const handleChangeText = (text: string) => {
        const parsedAmount = parseAmountText(text, format);
        const nextValue = parsedAmount?.value ?? 0;

        setSelection(null);
        setEditableText(parsedAmount?.text ?? '');
        pendingValueRef.current = nextValue;

        if (!commitOnBlur) {
            onChangeValue(nextValue);
        }
    };

    const handleFocus = (event: FocusEvent) => {
        const text = formatEditableAmount(value, format.decimalSeparator, format.decimalPlaces);

        onFocus?.(event);
        setEditableText(text);
        setSelection({ start: selectTextOnFocus ? 0 : text.length, end: text.length });
        pendingValueRef.current = value;
    };

    const handleBlur = (event: BlurEvent) => {
        onBlur?.(event);
        setEditableText(null);
        setSelection(null);

        if (commitOnBlur) {
            onChangeValue(pendingValueRef.current);
        }
    };

    const unfocusedText = value === 0 ? '' : format.format(value);

    return {
        value: editableText ?? unfocusedText,
        onChangeText: handleChangeText,
        onFocus: handleFocus,
        onBlur: handleBlur,
        keyboardType: 'decimal-pad',
        submitBehavior: 'submit',
        selectTextOnFocus,
        ...(isDefined(selection) && { selection })
    };
};
