import { RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { RULE_FIELD_OPERATORS } from '../../constant/rule-field-operators.constant';
import { RuleConditionFormFieldEnum } from '../../enum/rule-condition-form-field.enum';
import { RuleConditionEnumSelector } from '../rule-condition-enum-selector/rule-condition-enum-selector';

const OPERATOR_LABELS: Record<RuleConditionOperatorEnum, MessageDescriptor> = {
    [RuleConditionOperatorEnum.EQUALS]: msg`Equals`,
    [RuleConditionOperatorEnum.NOT_EQUALS]: msg`Not Equals`,
    [RuleConditionOperatorEnum.CONTAINS]: msg`Contains`,
    [RuleConditionOperatorEnum.NOT_CONTAINS]: msg`Not Contains`,
    [RuleConditionOperatorEnum.MATCHES_REGEX]: msg`Matches Regex`,
    [RuleConditionOperatorEnum.GREATER_THAN]: msg`Greater Than`,
    [RuleConditionOperatorEnum.LESS_THAN]: msg`Less Than`,
    [RuleConditionOperatorEnum.BETWEEN]: msg`Between`,
    [RuleConditionOperatorEnum.IN]: msg`In List`
};

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionOperatorSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const field = useWatch({ control, name: `conditions.${index}.field` });

    const validOperators = RULE_FIELD_OPERATORS[field];
    const options = validOperators.map(value => ({ value, label: OPERATOR_LABELS[value] }));

    return (
        <RuleConditionEnumSelector
            index={index}
            options={options}
            fieldName={RuleConditionFormFieldEnum.OPERATOR}
            label={t`Operator`}
            sheetTitle={t`Select Operator`}
            defaultLabel={t`Select Operator`}
            testID={testID}
        />
    );
};
