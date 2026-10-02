import { RuleDetectionModeEnum, SuggestRuleDataInterface } from '@budgie/rules';

import { UpdateRuleDataInterface } from '../../rule/interface/update-rule-data.interface';

export interface RulePillSlotPropsInterface {
    readonly ruleDetectionMode?: RuleDetectionModeEnum;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly updateRuleData?: UpdateRuleDataInterface | null;
    readonly matchingRulesCount?: number;
    readonly matchingRuleIds?: readonly number[];
    readonly onRuleCreated?: () => void;
    readonly onDismiss?: () => void;
    readonly onCreatingChange?: (next: boolean) => void;
}
