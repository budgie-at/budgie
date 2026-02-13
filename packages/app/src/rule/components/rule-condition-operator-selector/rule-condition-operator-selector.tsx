import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { RuleConditionEnumSelector } from '../rule-condition-enum-selector/rule-condition-enum-selector';

import { FIELD_OPERATORS } from './field-operators.constant';
import { OPERATOR_LABELS } from './operator-options.constant';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionOperatorSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RuleCreateInputInterface>();

    const field = useWatch({ control, name: `conditions.${index}.field` });
    const operator = useWatch({ control, name: `conditions.${index}.operator` });

    const validOperators = FIELD_OPERATORS[field];
    const options = validOperators.map(value => ({ value, label: OPERATOR_LABELS[value] }));

    useEffect(() => {
        if (!validOperators.includes(operator)) {
            setValue(`conditions.${index}.operator`, validOperators[0]);
        }
    }, [field, operator, validOperators, setValue, index]);

    return (
        <RuleConditionEnumSelector
            index={index}
            options={options}
            fieldName="operator"
            label={t`Operator`}
            sheetTitle={t`Select Operator`}
            defaultLabel={t`Select Operator`}
            testID={testID}
        />
    );
};
