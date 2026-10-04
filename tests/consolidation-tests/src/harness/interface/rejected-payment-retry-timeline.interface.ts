export interface RejectedPaymentRetryTimelineInterface {
    readonly rejectedAt: Date;
    readonly principalRefundAt: Date;
    readonly feeRefundAt: Date;
    readonly retryAt: Date;
    readonly receivedAt: Date;
}
