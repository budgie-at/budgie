import { RuleConditionMatchTypeEnum, RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { getRuleOutcomeLabel } from '../utils/get-rule-outcome-label.util';

import { useRuleConditionFormatter } from './use-rule-condition-formatter.hook';

import type { RuleRowSummaryInterface } from '../interface/rule-row-summary.interface';
import type { MessageDescriptor } from '@lingui/core';

export const useRuleRowSummary = (rule: RuleWithActionsRelationsEntityInterface): RuleRowSummaryInterface => {
    const { t } = useLingui();
    const formatCondition = useRuleConditionFormatter();
    const labels = rule.conditions.map(formatCondition);
    const firstLabel = labels.at(0);
    const outcomeLabel = getRuleOutcomeLabel(rule.actions, (descriptor: MessageDescriptor) => t(descriptor));
    const title = isNotEmptyString(outcomeLabel) ? outcomeLabel : t`No action yet`;
    const joiner = rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL ? t`and` : t`or`;
    const conditionsText = labels.map(label => [label.field, label.operator, label.value].join(' ')).join(` ${joiner} `);
    const statusLabel = rule.enabled ? t`On` : t`Off`;

    return {
        title,
        triggerPrefix: [firstLabel?.fieldLabel, firstLabel?.operator].filter(isNotEmptyString).join(' '),
        triggerValue: firstLabel?.value ?? '',
        extraConditionCount: Math.max(labels.length - 1, 0),
        accessibilityLabel: t`When ${conditionsText}, ${title}. ${statusLabel}`
    };
};
