import { RuleActionTypeEnum, RuleConditionMatchTypeEnum, RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { RULE_CONDITION_VALUE_MARKER } from '../constant/rule-condition-value-marker.constant';

import { useRuleConditionFormatter } from './use-rule-condition-formatter.hook';

import type { RuleRowSummaryInterface } from '../interface/rule-row-summary.interface';
import type { RuleActionWithRelationsEntityInterface } from '@budgie/contracts';

const OUTCOME_SEPARATOR = ' · ';

const getActionOutcome = (action: RuleActionWithRelationsEntityInterface): string => {
    switch (action.type) {
        case RuleActionTypeEnum.SET_CATEGORY:
            return action.category?.title ?? '';
        case RuleActionTypeEnum.ADD_TAG:
            return isNotEmptyString(action.tag?.title) ? `#${action.tag.title}` : '';
        case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
        default:
            return action.account?.title ?? '';
    }
};

const getRuleOutcomeParts = (actions: readonly RuleActionWithRelationsEntityInterface[]): string[] =>
    actions.map(getActionOutcome).filter(isNotEmptyString);

export const useRuleRowSummary = (rule: RuleWithActionsRelationsEntityInterface): RuleRowSummaryInterface => {
    const { t } = useLingui();
    const formatCondition = useRuleConditionFormatter();
    const labels = rule.conditions.map(formatCondition);
    const firstLabel = labels.at(0);
    const outcomeParts = getRuleOutcomeParts(rule.actions);
    const secondaryParts = outcomeParts.slice(1);
    const primaryOutcome = outcomeParts.at(0) ?? t`No action yet`;
    const title = [primaryOutcome, ...secondaryParts].join(OUTCOME_SEPARATOR);
    const isMatchAll = rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL;
    const joiner = isMatchAll ? t`and` : t`or`;
    const extraCount = Math.max(labels.length - 1, 0);
    const extraLabel = isMatchAll ? t`and +${extraCount}` : t`or +${extraCount}`;
    const conditionsText = labels.map(label => label.phraseTemplate.replace(RULE_CONDITION_VALUE_MARKER, label.value)).join(` ${joiner} `);
    const statusLabel = rule.enabled ? t`On` : t`Off`;

    return {
        primaryOutcome,
        secondaryOutcome: secondaryParts.map(part => `${OUTCOME_SEPARATOR}${part}`).join(''),
        triggerOverflow: firstLabel?.listOverflow ?? null,
        triggerPrefix: firstLabel?.listTemplate.split(RULE_CONDITION_VALUE_MARKER).at(0) ?? '',
        triggerValue: firstLabel?.listValue ?? '',
        trigger: isDefined(firstLabel) ? firstLabel.listTemplate.replace(RULE_CONDITION_VALUE_MARKER, firstLabel.listValue) : '',
        extraConditionsLabel: isPositiveNumber(extraCount) ? extraLabel : null,
        accessibilityLabel: t`When ${conditionsText}, ${title}. ${statusLabel}`
    };
};
