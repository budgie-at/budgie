import { RuleConditionFieldEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { RULE_CONDITION_FIELD } from '../../constant/rule-condition-field.constant';
import { RULE_FIELD_OPERATORS } from '../../constant/rule-field-operators.constant';
import { useRuleSelectorModal } from '../../context/rule-selector-modal.context';
import { buildRuleSelectorOptions } from '../../utils/build-rule-selector-options.util';
import { RuleFormPickerHead } from '../rule-form-picker-head/rule-form-picker-head';

import type { MessageDescriptor } from '@lingui/core';

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
    const [openRuleSelector] = useRuleSelectorModal();
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

    const handleOpen = () => {
        openRuleSelector(
            {
                title: t`Match on`,
                options: buildRuleSelectorOptions(FIELD_VALUES, RULE_CONDITION_FIELD, (descriptor: MessageDescriptor) => t(descriptor)),
                selectedValue: field
            },
            result => {
                const nextField = FIELD_VALUES.find(value => value === result);

                if (isDefined(nextField)) {
                    handleSelect(nextField);
                }
            }
        );
    };

    return (
        <RuleFormPickerHead
            meta={RULE_CONDITION_FIELD[field]}
            label={label}
            accessibilityLabel={t`Match on ${label}`}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
