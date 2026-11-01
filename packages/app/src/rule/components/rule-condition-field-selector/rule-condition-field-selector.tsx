import { RuleConditionFieldEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { RULE_CONDITION_FIELD } from '../../constant/rule-condition-field.constant';
import { RULE_FIELD_OPERATORS } from '../../constant/rule-field-operators.constant';
import { useRuleOptionSheet } from '../../hooks/use-rule-option-sheet.hook';
import { RuleFormPickerPill } from '../rule-form-picker-pill/rule-form-picker-pill';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

const FIELD_VALUES = [
    RuleConditionFieldEnum.TITLE,
    RuleConditionFieldEnum.COMMENT,
    RuleConditionFieldEnum.AMOUNT,
    RuleConditionFieldEnum.ACCOUNT_ID,
    RuleConditionFieldEnum.MCC_CODE,
    RuleConditionFieldEnum.TRANSACTION_TYPE,
    RuleConditionFieldEnum.EXTERNAL_SOURCE
] as const;

const TEXT_FIELDS = new Set([RuleConditionFieldEnum.TITLE, RuleConditionFieldEnum.COMMENT]);

export const RuleConditionFieldSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, getValues, setValue } = useFormContext<RuleCreateInputInterface>();
    const field = useWatch({ control, name: `conditions.${index}.field` });
    const openFieldSheet = useRuleOptionSheet(t`Match on`, RULE_CONDITION_FIELD);
    const label = t(RULE_CONDITION_FIELD[field].label);

    const handleSelect = (nextField: RuleConditionFieldEnum) => {
        const validOperators = RULE_FIELD_OPERATORS[nextField];
        const keepsValue = TEXT_FIELDS.has(field) && TEXT_FIELDS.has(nextField);

        setValue(`conditions.${index}.field`, nextField, { shouldDirty: true });

        if (!validOperators.includes(getValues(`conditions.${index}.operator`))) {
            setValue(`conditions.${index}.operator`, validOperators[0], { shouldDirty: true });
        }

        if (!keepsValue && nextField !== field) {
            setValue(`conditions.${index}.value`, '', { shouldDirty: true });
            setValue(`conditions.${index}.secondaryValue`, null, { shouldDirty: true });
        }
    };

    const handleOpen = () => void openFieldSheet({ values: FIELD_VALUES, selectedValue: field, onSelect: handleSelect });

    return (
        <RuleFormPickerPill
            label={label}
            icon={RULE_CONDITION_FIELD[field].icon}
            accessibilityLabel={t`Match on ${label}`}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
