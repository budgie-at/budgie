import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { RuleSuggestionCard } from '../../../rule/components/rule-suggestion-card/rule-suggestion-card';
import { RuleUpdateCard } from '../../../rule/components/rule-update-card/rule-update-card';
import { RuleDetectionModeEnum } from '../../../rule/enum/rule-detection-mode.enum';
import { SuggestRuleDataInterface } from '../../../rule/interface/suggest-rule-data.interface';
import { UpdateRuleDataInterface } from '../../../rule/interface/update-rule-data.interface';

interface Props {
    readonly ruleDetectionMode: RuleDetectionModeEnum;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly updateRuleData?: UpdateRuleDataInterface | null;
    readonly matchingRulesCount?: number;
    readonly onRuleCreated?: () => void;
    readonly onDismiss?: () => void;
    readonly onCreatingChange?: (next: boolean) => void;
}

export const RulePillSlot = (props: Props) => {
    const { ruleDetectionMode, suggestRuleData, updateRuleData, matchingRulesCount, onRuleCreated, onDismiss, onCreatingChange } = props;

    if (
        ruleDetectionMode === RuleDetectionModeEnum.SUGGEST &&
        isDefined(suggestRuleData) &&
        isDefined(onRuleCreated) &&
        isDefined(onDismiss)
    ) {
        return (
            <RuleSuggestionCard
                suggestRuleData={suggestRuleData}
                onRuleCreated={onRuleCreated}
                onDismiss={onDismiss}
                onCreatingChange={onCreatingChange}
            />
        );
    }

    if (
        ruleDetectionMode === RuleDetectionModeEnum.UPDATE &&
        isDefined(updateRuleData) &&
        isDefined(onRuleCreated) &&
        isDefined(onDismiss)
    ) {
        return <RuleUpdateCard updateRuleData={updateRuleData} onRuleUpdated={onRuleCreated} onDismiss={onDismiss} />;
    }

    if (ruleDetectionMode === RuleDetectionModeEnum.MATCH && isPositiveNumber(matchingRulesCount)) {
        return <MatchingRulesPill matchingRulesCount={matchingRulesCount} />;
    }

    return null;
};
