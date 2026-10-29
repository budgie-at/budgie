export interface CategorizeInboxPendingTransferInterface {
    readonly clusterKey: string;
    readonly clusterTitle: string;
    readonly ruleConditionValue: string;
    readonly accountId: number;
    readonly accountTitle: string;
    readonly transactionIds: number[];
    readonly isRuleEnabled: boolean;
}
