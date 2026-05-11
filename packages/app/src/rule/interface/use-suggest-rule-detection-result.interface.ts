import type { SuggestRuleDataInterface } from './suggest-rule-data.interface';
import type { UpdateRuleDataInterface } from './update-rule-data.interface';
import type { RuleDetectionModeEnum } from '../enum/rule-detection-mode.enum';

export interface UseSuggestRuleDetectionResultInterface {
    readonly mode: RuleDetectionModeEnum;
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly updateRuleData: UpdateRuleDataInterface | null;
    readonly matchingRulesCount: number;
    readonly onRuleCreated: () => void;
    readonly onDismiss: () => void;
}
