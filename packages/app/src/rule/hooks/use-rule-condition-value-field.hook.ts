import { RuleCreateInputInterface } from '@budgie/contracts';
import { useController, useFormContext } from 'react-hook-form';

export const useRuleConditionValueField = (index: number) => {
    const { control } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value, onChange }
    } = useController({ control, name: `conditions.${index}.value` });

    return { value, onChange };
};
