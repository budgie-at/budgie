import { RuleConditionFieldEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

import { RULE_CONDITION_FIELD } from '../constant/rule-condition-field.constant';
import { RULE_CONDITION_OPERATOR } from '../constant/rule-condition-operator.constant';
import { isValidRulePattern } from '../utils/is-valid-rule-pattern.util';

import type { RuleTextValueMetaInterface } from '../interface/rule-text-value-meta.interface';

export const useRuleTextValueMeta = (index: number): RuleTextValueMetaInterface => {
    const { t } = useLingui();
    const { control, formState } = useFormContext<RuleCreateInputInterface>();
    const [field, operator, value] = useWatch({
        control,
        name: [`conditions.${index}.field`, `conditions.${index}.operator`, `conditions.${index}.value`]
    });
    const isPattern = operator === RuleConditionOperatorEnum.MATCHES_REGEX;
    const isEmpty = !isNotEmptyString(value.trim());
    const isPatternInvalid = isPattern && !isEmpty && !isValidRulePattern(value);
    const isMissing = isEmpty && (formState.isDirty || formState.submitCount > 0);
    const textPlaceholder = field === RuleConditionFieldEnum.COMMENT ? t`e.g. lunch with team` : t`e.g. Netflix`;
    const patternHint = isPatternInvalid ? t`This pattern isn't valid yet` : t`Letter case is ignored`;
    const missingHint = isMissing ? t`Required` : null;
    const fieldLabel = t(RULE_CONDITION_FIELD[field].label);
    const operatorLabel = t(RULE_CONDITION_OPERATOR[operator].phrase);

    return {
        isPattern,
        placeholder: isPattern ? t`e.g. ^uber.*trip` : textPlaceholder,
        hint: isPattern ? patternHint : missingHint,
        isHintWarning: isPatternInvalid || isMissing,
        accessibilityLabel: t`${fieldLabel} ${operatorLabel}, value`
    };
};
