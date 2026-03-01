import { RuleWithRelationsEntityInterface } from '@budgie/contracts';

export interface ComputeDetectionModeParamsInterface {
    readonly isBankSynced: boolean;
    readonly hasChanges: boolean;
    readonly ruleCreated: boolean;
    readonly matchingRule: RuleWithRelationsEntityInterface | undefined;
    readonly appliedRule: RuleWithRelationsEntityInterface | null | undefined;
}
