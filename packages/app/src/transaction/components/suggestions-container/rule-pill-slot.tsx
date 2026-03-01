import { RuleWithRelationsEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { RuleMatchPill } from '../../../rule/components/rule-match-pill/rule-match-pill';
import { RuleSuggestionPill } from '../../../rule/components/rule-suggestion-pill/rule-suggestion-pill';
import { SuggestRuleDataInterface } from '../../../rule/interface/suggest-rule-data.interface';
import { RuleDetectionModeType } from '../../../rule/type/rule-detection-mode.type';

interface Props {
    readonly ruleDetectionMode: RuleDetectionModeType;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly matchingRule?: RuleWithRelationsEntityInterface;
    readonly onRuleCreated?: () => void;
}

export const RulePillSlot = (props: Props) => {
    const { ruleDetectionMode, suggestRuleData, matchingRule, onRuleCreated } = props;

    if (ruleDetectionMode === 'suggest' && isDefined(suggestRuleData) && isDefined(onRuleCreated)) {
        return <RuleSuggestionPill suggestRuleData={suggestRuleData} compact onRuleCreated={onRuleCreated} />;
    }

    if (ruleDetectionMode === 'match' && isDefined(matchingRule)) {
        return <RuleMatchPill matchingRule={matchingRule} compact />;
    }

    return null;
};
