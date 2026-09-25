export interface CategorizeInboxAssignmentInterface {
    readonly clusterKey: string;
    readonly categoryId: number;
    readonly transactionIds: number[];
    readonly ruleConditionValue: string;
}
