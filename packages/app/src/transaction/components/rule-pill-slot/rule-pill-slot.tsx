import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { RuleSuggestionCard } from '../../../rule/components/rule-suggestion-card/rule-suggestion-card';
import { SuggestRuleDataInterface } from '../../../rule/interface/suggest-rule-data.interface';
import { RuleDetectionModeType } from '../../../rule/type/rule-detection-mode.type';

interface Props {
    readonly ruleDetectionMode: RuleDetectionModeType;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly matchingRulesCount?: number;
    readonly onRuleCreated?: () => void;
    readonly onDismiss?: () => void;
}

export const RulePillSlot = (props: Props) => {
    const { ruleDetectionMode, suggestRuleData, matchingRulesCount, onRuleCreated, onDismiss } = props;

    if (ruleDetectionMode === 'suggest' && isDefined(suggestRuleData) && isDefined(onRuleCreated) && isDefined(onDismiss)) {
        return <RuleSuggestionCard suggestRuleData={suggestRuleData} onRuleCreated={onRuleCreated} onDismiss={onDismiss} />;
    }

    if (ruleDetectionMode === 'match' && isPositiveNumber(matchingRulesCount)) {
        return <MatchingRulesPill matchingRulesCount={matchingRulesCount} />;
    }

    return null;
};
