export interface TransactionInfoActionHandlersInterface {
    readonly onDelete: () => Promise<void> | void;
    readonly onRevert?: () => void;
    readonly onConvertToTransfer?: () => void;
    readonly onConvertToRefund?: () => void;
    readonly onOpenRefundSources?: () => void;
    readonly onOpenConsolidationSources?: () => void;
}
