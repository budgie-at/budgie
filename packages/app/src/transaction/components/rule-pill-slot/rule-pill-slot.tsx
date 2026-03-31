import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { RuleSuggestionPill } from '../../../rule/components/rule-suggestion-pill/rule-suggestion-pill';
import { SuggestRuleDataInterface } from '../../../rule/interface/suggest-rule-data.interface';
import { RuleDetectionModeType } from '../../../rule/type/rule-detection-mode.type';

interface Props {
    readonly ruleDetectionMode: RuleDetectionModeType;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly matchingRulesCount?: number;
    readonly onRuleCreated?: () => void;
}

export const RulePillSlot = (props: Props) => {
    const { ruleDetectionMode, suggestRuleData, matchingRulesCount, onRuleCreated } = props;

    if (ruleDetectionMode === 'suggest' && isDefined(suggestRuleData) && isDefined(onRuleCreated)) {
        return <RuleSuggestionPill suggestRuleData={suggestRuleData} onRuleCreated={onRuleCreated} />;
    }

    if (ruleDetectionMode === 'match' && isPositiveNumber(matchingRulesCount)) {
        return <MatchingRulesPill matchingRulesCount={matchingRulesCount} />;
    }

    return null;
};
