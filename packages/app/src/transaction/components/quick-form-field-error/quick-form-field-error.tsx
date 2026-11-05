import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useFormState } from 'react-hook-form';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import type { QuickFormValidationField } from '../../interface/quick-form-validation-field.type';

interface Props {
    readonly fields: readonly QuickFormValidationField[];
}

export const QuickFormFieldError = ({ fields }: Props) => {
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const { errors } = useFormState({ control });
    const message = fields.map(field => errors.root?.[field]?.message).find(isNotEmptyString);

    return isNotEmptyString(message) ? (
        <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className="px-3xl pt-md text-[13px] leading-[18px] text-destructive-strong"
        >
            {message}
        </Text>
    ) : null;
};
