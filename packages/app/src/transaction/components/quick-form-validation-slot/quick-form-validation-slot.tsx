import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useEffect, useRef } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';

import type { QuickFormValidationField } from '../../interface/quick-form-validation-field.type';
import type { ReactNode } from 'react';

interface Props {
    readonly children?: ReactNode;
    readonly numberOfLines?: 1 | 2;
}

const MAX_VALIDATION_FONT_SCALE = 1.35;
const VALIDATION_FIELDS: readonly QuickFormValidationField[] = ['amount', 'entries', 'fromAccountId', 'toAccountId'];

export const QuickFormValidationSlot = ({ children = null, numberOfLines = 2 }: Props) => {
    const { control, clearErrors } = useFormContext<TransactionCreateInputInterface>();
    const { errors } = useFormState({ control });
    const fieldValues = useWatch({ control, name: VALIDATION_FIELDS });
    const previousFieldValuesRef = useRef(fieldValues);

    const message = VALIDATION_FIELDS.map(field => errors.root?.[field]?.message).find(isNotEmptyString);
    const maxFontSizeMultiplier = numberOfLines === 1 ? 1 : MAX_VALIDATION_FONT_SCALE;

    useEffect(() => {
        VALIDATION_FIELDS.forEach((field, index) => {
            if (fieldValues[index] !== previousFieldValuesRef.current[index]) {
                clearErrors(`root.${field}`);
            }
        });
        previousFieldValuesRef.current = fieldValues;
    });

    return isNotEmptyString(message) ? (
        <View className="flex-1 items-center justify-center self-stretch px-xl" accessibilityLiveRegion="polite">
            <Text
                numberOfLines={numberOfLines}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
                accessibilityRole="alert"
                accessibilityLabel={message}
                testID={SimpleQuickFormSelector.ValidationMessage}
                className="text-center text-[14px] leading-[16px] font-semibold text-destructive-strong"
            >
                {message}
            </Text>
        </View>
    ) : (
        children
    );
};
