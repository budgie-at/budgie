export interface ApplePayCaptureInputInterface {
    readonly accountId: number;
    readonly amount: number;
    readonly captureId: string;
    readonly categoryId?: number;
    readonly comment?: string;
    readonly entryAmounts?: readonly number[];
    readonly exchangeRate?: number;
    readonly merchant?: string;
    readonly operatedAt: Date;
    readonly tagIds?: readonly number[];
}
