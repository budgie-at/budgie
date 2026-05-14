import { RuleDetectionModeEnum } from '../../rule/enum/rule-detection-mode.enum';
import { SuggestRuleDataInterface } from '../../rule/interface/suggest-rule-data.interface';
import { UpdateRuleDataInterface } from '../../rule/interface/update-rule-data.interface';

export interface RulePillSlotPropsInterface {
    readonly ruleDetectionMode?: RuleDetectionModeEnum;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly updateRuleData?: UpdateRuleDataInterface | null;
    readonly matchingRulesCount?: number;
    readonly onRuleCreated?: () => void;
    readonly onDismiss?: () => void;
    readonly onCreatingChange?: (next: boolean) => void;
}
