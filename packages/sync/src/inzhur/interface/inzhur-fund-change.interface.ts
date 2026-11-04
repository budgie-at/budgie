export interface InzhurFundChangeInterface {
    readonly isin: string;
    readonly name: string;
    readonly accountId: number;
    readonly deltaQuantity: number;
    readonly exchangedAmount: number;
    readonly dividendAmount: number;
    readonly isPriceMissing: boolean;
    readonly isPayoutSettingStale: boolean;
}
