export interface SyncAutomationResultInterface {
    readonly consolidated: number;
    readonly ruleTransactionCount: number;
    readonly embeddingQueuedCount: number;
    readonly isRecurringDetected: boolean;
}
