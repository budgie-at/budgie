import { RuleConditionMatchTypeEnum, RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { getRuleOutcomeParts } from '../utils/get-rule-outcome-parts.util';

import { useRuleConditionFormatter } from './use-rule-condition-formatter.hook';

import type { RuleRowSummaryInterface } from '../interface/rule-row-summary.interface';
import type { MessageDescriptor } from '@lingui/core';

const OUTCOME_SEPARATOR = ' · ';

export const useRuleRowSummary = (rule: RuleWithActionsRelationsEntityInterface): RuleRowSummaryInterface => {
    const { t } = useLingui();
    const formatCondition = useRuleConditionFormatter();
    const labels = rule.conditions.map(formatCondition);
    const firstLabel = labels.at(0);
    const outcomeParts = getRuleOutcomeParts(rule.actions, (descriptor: MessageDescriptor) => t(descriptor));
    const secondaryParts = outcomeParts.slice(1);
    const primaryOutcome = outcomeParts.at(0) ?? t`No action yet`;
    const title = [primaryOutcome, ...secondaryParts].join(OUTCOME_SEPARATOR);
    const isMatchAll = rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL;
    const joiner = isMatchAll ? t`and` : t`or`;
    const extraCount = Math.max(labels.length - 1, 0);
    const extraLabel = isMatchAll ? t`and +${extraCount}` : t`or +${extraCount}`;
    const conditionsText = labels.map(label => [label.field, label.operator, label.value].join(' ')).join(` ${joiner} `);
    const statusLabel = rule.enabled ? t`On` : t`Off`;

    return {
        primaryOutcome,
        secondaryOutcome: secondaryParts.map(part => `${OUTCOME_SEPARATOR}${part}`).join(''),
        triggerPrefix: firstLabel?.shortPredicate ?? '',
        triggerValue: firstLabel?.rawValue ?? '',
        isTriggerQuoted: firstLabel?.isQuoted ?? false,
        extraConditionsLabel: isPositiveNumber(extraCount) ? extraLabel : null,
        accessibilityLabel: t`When ${conditionsText}, ${title}. ${statusLabel}`
    };
};
