import { RuleDetectionModeEnum } from '@budgie/rules';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { RuleSuggestionCard } from '../../../rule/components/rule-suggestion-card/rule-suggestion-card';
import { RuleUpdateCard } from '../../../rule/components/rule-update-card/rule-update-card';

import type { RuleDetectionType } from '../../interface/rule-detection.type';

interface Props {
    readonly ruleDetection?: RuleDetectionType;
}

export const RulePillSlot = ({ ruleDetection }: Props) => {
    if (!isDefined(ruleDetection)) {
        return null;
    }

    const { mode, suggestRuleData, updateRuleData, matchingRulesCount, matchingRuleIds, onRuleCreated, onDismiss, onCreatingChange } =
        ruleDetection;

    if (mode === RuleDetectionModeEnum.SUGGEST) {
        return (
            <RuleSuggestionCard
                suggestRuleData={suggestRuleData}
                onRuleCreated={onRuleCreated}
                onDismiss={onDismiss}
                onCreatingChange={onCreatingChange}
            />
        );
    }

    if (mode === RuleDetectionModeEnum.UPDATE && isDefined(updateRuleData)) {
        return <RuleUpdateCard updateRuleData={updateRuleData} onRuleUpdated={onRuleCreated} onDismiss={onDismiss} />;
    }

    if (mode === RuleDetectionModeEnum.MATCH && isPositiveNumber(matchingRulesCount)) {
        return <MatchingRulesPill matchingRulesCount={matchingRulesCount} matchingRuleIds={matchingRuleIds} />;
    }

    return null;
};
