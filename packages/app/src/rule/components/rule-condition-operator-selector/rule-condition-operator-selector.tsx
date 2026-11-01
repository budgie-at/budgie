import { RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { RULE_CONDITION_OPERATOR } from '../../constant/rule-condition-operator.constant';
import { RULE_FIELD_OPERATORS } from '../../constant/rule-field-operators.constant';
import { useRuleOptionSheet } from '../../hooks/use-rule-option-sheet.hook';
import { RuleFormPickerPill } from '../rule-form-picker-pill/rule-form-picker-pill';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionOperatorSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RuleCreateInputInterface>();
    const field = useWatch({ control, name: `conditions.${index}.field` });
    const operator = useWatch({ control, name: `conditions.${index}.operator` });
    const openOperatorSheet = useRuleOptionSheet(t`How to compare`, RULE_CONDITION_OPERATOR);
    const validOperators = RULE_FIELD_OPERATORS[field];
    const label = t(RULE_CONDITION_OPERATOR[operator].label);

    const handleSelect = (nextOperator: RuleConditionOperatorEnum) =>
        void setValue(`conditions.${index}.operator`, nextOperator, { shouldDirty: true });
    const handleOpen = () => void openOperatorSheet({ values: validOperators, selectedValue: operator, onSelect: handleSelect });

    return <RuleFormPickerPill label={label} accessibilityLabel={t`Condition: ${label}`} onPress={handleOpen} testID={testID} />;
};
