export interface CategorizeInboxAssignmentInterface {
    readonly clusterKey: string;
    readonly displayTitle: string;
    readonly labelId: number;
    readonly transactionIds: number[];
    readonly ruleConditionValue: string;
    readonly followUpLabelIds: number[];
}
