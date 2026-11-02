import { TransactionCreateInputInterface } from '@budgie/contracts';
import { ReactNode, useEffect, useRef } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Text, useWindowDimensions, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import type { QuickFormValidationField } from '../../interface/quick-form-validation-field.type';

interface Props {
    readonly children?: ReactNode;
}

const VALIDATION_FIELDS: readonly QuickFormValidationField[] = ['amount', 'fromAccountId', 'toAccountId', 'entries'];

export const QuickFormValidationSlot = ({ children }: Props) => {
    const { fontScale } = useWindowDimensions();
    const captionStyle = { minHeight: 40 * fontScale };
    const { control, clearErrors } = useFormContext<TransactionCreateInputInterface>();
    const { errors } = useFormState({ control });
    const fieldValues = useWatch({ control, name: VALIDATION_FIELDS });
    const previousFieldValuesRef = useRef(fieldValues);

    const message = VALIDATION_FIELDS.map(field => errors.root?.[field]?.message).find(isNotEmptyString);

    useEffect(() => {
        VALIDATION_FIELDS.forEach((field, index) => {
            if (fieldValues[index] !== previousFieldValuesRef.current[index]) {
                clearErrors(`root.${field}`);
            }
        });
        previousFieldValuesRef.current = fieldValues;
    });

    return (
        <View className="items-center gap-xxs self-stretch">
            <View className="min-h-[32px] items-center justify-center">{children}</View>
            <View className="items-center justify-center self-stretch px-xl" style={captionStyle} accessibilityLiveRegion="polite">
                {isNotEmptyString(message) ? (
                    <Text
                        accessibilityRole="alert"
                        className="text-center text-[14px] leading-[20px] font-semibold text-destructive-strong"
                    >
                        {message}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};
