import type { ApplyRuleResultInterface } from '@budgie/rules';

export interface PendingRuleApplicationInterface {
    readonly ruleId: number;
    readonly onSettled?: (result: ApplyRuleResultInterface | null, error: unknown) => void;
}
