export interface DetectionModeParamsInterface {
    readonly hasChanges: boolean;
    readonly ruleCreated: boolean;
    readonly isDismissed: boolean;
    readonly matchingRulesCount: number;
    readonly hasConflictWithMatchingRules: boolean;
}
