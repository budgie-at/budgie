import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { RuleSuggestionCard } from '../../../rule/components/rule-suggestion-card/rule-suggestion-card';
import { RuleUpdateCard } from '../../../rule/components/rule-update-card/rule-update-card';
import { SuggestRuleDataInterface } from '../../../rule/interface/suggest-rule-data.interface';
import { UpdateRuleDataInterface } from '../../../rule/interface/update-rule-data.interface';
import { RuleDetectionModeType } from '../../../rule/type/rule-detection-mode.type';

interface Props {
    readonly ruleDetectionMode: RuleDetectionModeType;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly updateRuleData?: UpdateRuleDataInterface | null;
    readonly matchingRulesCount?: number;
    readonly onRuleCreated?: () => void;
    readonly onDismiss?: () => void;
}

export const RulePillSlot = (props: Props) => {
    const { ruleDetectionMode, suggestRuleData, updateRuleData, matchingRulesCount, onRuleCreated, onDismiss } = props;

    if (ruleDetectionMode === 'suggest' && isDefined(suggestRuleData) && isDefined(onRuleCreated) && isDefined(onDismiss)) {
        return <RuleSuggestionCard suggestRuleData={suggestRuleData} onRuleCreated={onRuleCreated} onDismiss={onDismiss} />;
    }

    if (ruleDetectionMode === 'update' && isDefined(updateRuleData) && isDefined(onRuleCreated) && isDefined(onDismiss)) {
        return <RuleUpdateCard updateRuleData={updateRuleData} onRuleUpdated={onRuleCreated} onDismiss={onDismiss} />;
    }

    if (ruleDetectionMode === 'match' && isPositiveNumber(matchingRulesCount)) {
        return <MatchingRulesPill matchingRulesCount={matchingRulesCount} />;
    }

    return null;
};
