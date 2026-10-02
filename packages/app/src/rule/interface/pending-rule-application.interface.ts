import type { ApplyRuleResultInterface } from './apply-rule-result.interface';

export interface PendingRuleApplicationInterface {
    readonly ruleId: number;
    readonly onSettled?: (result: ApplyRuleResultInterface | null, error: unknown) => void;
}
