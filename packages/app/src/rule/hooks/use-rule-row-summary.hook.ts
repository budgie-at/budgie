import {
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleWithActionsRelationsEntityInterface
} from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { getRuleOutcomeLabel } from '../utils/get-rule-outcome-label.util';

import { useRuleConditionLabel } from './use-rule-condition-label.hook';

import type { RuleRowSummaryInterface } from '../interface/rule-row-summary.interface';
import type { MessageDescriptor } from '@lingui/core';

const FALLBACK_CONDITION = {
    field: RuleConditionFieldEnum.TITLE,
    operator: RuleConditionOperatorEnum.CONTAINS,
    value: '',
    secondaryValue: null
};

export const useRuleRowSummary = (rule: RuleWithActionsRelationsEntityInterface): RuleRowSummaryInterface => {
    const { t } = useLingui();
    const { fieldLabel, field, operator, value } = useRuleConditionLabel(rule.conditions.at(0) ?? FALLBACK_CONDITION);
    const extraCount = rule.conditions.length - 1;
    const outcomeLabel = getRuleOutcomeLabel(rule.actions, (descriptor: MessageDescriptor) => t(descriptor));
    const title = isNotEmptyString(outcomeLabel) ? outcomeLabel : t`No action yet`;
    const trigger = [fieldLabel, operator, value].join(' ');
    const moreConditions =
        rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL
            ? t({ message: plural(extraCount, { one: 'and # more', other: 'and # more' }) })
            : t({ message: plural(extraCount, { one: 'or # more', other: 'or # more' }) });
    const fullTrigger = extraCount > 0 ? [trigger, moreConditions].join(' ') : trigger;
    const statusLabel = rule.enabled ? t`On` : t`Off`;

    return {
        title,
        subtitle: rule.enabled ? fullTrigger : t`Off · ${fullTrigger}`,
        accessibilityLabel: t`When ${field} ${operator} ${value}, ${title}. ${statusLabel}`
    };
};
