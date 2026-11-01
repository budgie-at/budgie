import { TransactionCreateInputInterface } from '@budgie/contracts';
import { ReactNode, useEffect, useRef } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import type { QuickFormValidationField } from '../../interface/quick-form-validation-field.type';

interface Props {
    readonly children?: ReactNode;
}

const VALIDATION_FIELDS: readonly QuickFormValidationField[] = ['amount', 'fromAccountId', 'toAccountId', 'entries'];

export const QuickFormValidationSlot = ({ children }: Props) => {
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
        <View className="h-[32px] items-center justify-center">
            {isNotEmptyString(message) ? (
                <Text className="text-[13px] font-medium text-destructive-strong" numberOfLines={1}>
                    {message}
                </Text>
            ) : (
                children
            )}
        </View>
    );
};
