import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useEffect, useRef } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { QuickFormCaptionSlot } from '../quick-form-caption-slot/quick-form-caption-slot';

import type { QuickFormValidationField } from '../../interface/quick-form-validation-field.type';

const VALIDATION_FIELDS: readonly QuickFormValidationField[] = ['amount', 'fromAccountId', 'toAccountId', 'entries'];

export const QuickFormValidationSlot = () => {
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
        <QuickFormCaptionSlot>
            {isNotEmptyString(message) ? (
                <Text
                    numberOfLines={2}
                    accessibilityRole="alert"
                    className="text-center text-[14px] leading-[20px] font-semibold text-destructive-strong"
                >
                    {message}
                </Text>
            ) : null}
        </QuickFormCaptionSlot>
    );
};
