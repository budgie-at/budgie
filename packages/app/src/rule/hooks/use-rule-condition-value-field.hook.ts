import { RuleCreateInputInterface } from '@budgie/contracts';
import { useController, useFormContext } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

export const useRuleConditionValueField = (index: number) => {
    const { control, formState } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value, onChange }
    } = useController({ control, name: `conditions.${index}.value` });

    return { value, onChange, isMissing: !isNotEmptyString(value) && (formState.isDirty || formState.submitCount > 0) };
};
