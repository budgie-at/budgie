import { RuleConditionOperatorEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { RuleConditionEnumSelector } from '../rule-condition-enum-selector/rule-condition-enum-selector';

interface Props {
    readonly index: number;
}

const OPERATOR_OPTIONS = [
    { value: RuleConditionOperatorEnum.EQUALS, label: msg`Equals` },
    { value: RuleConditionOperatorEnum.NOT_EQUALS, label: msg`Not Equals` },
    { value: RuleConditionOperatorEnum.CONTAINS, label: msg`Contains` },
    { value: RuleConditionOperatorEnum.NOT_CONTAINS, label: msg`Not Contains` },
    { value: RuleConditionOperatorEnum.MATCHES_REGEX, label: msg`Matches Regex` },
    { value: RuleConditionOperatorEnum.GREATER_THAN, label: msg`Greater Than` },
    { value: RuleConditionOperatorEnum.LESS_THAN, label: msg`Less Than` },
    { value: RuleConditionOperatorEnum.BETWEEN, label: msg`Between` },
    { value: RuleConditionOperatorEnum.IN, label: msg`In List` }
];

export const RuleConditionOperatorSelector = ({ index }: Props) => {
    const { t } = useLingui();

    return (
        <RuleConditionEnumSelector
            index={index}
            options={OPERATOR_OPTIONS}
            fieldName="operator"
            label={t`Operator`}
            sheetTitle={t`Select Operator`}
            defaultLabel={t`Select Operator`}
        />
    );
};
