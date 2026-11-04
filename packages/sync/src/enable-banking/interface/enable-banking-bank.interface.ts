export interface EnableBankingBankInterface {
    readonly name: string;
    readonly country: string;
    readonly maximumConsentValiditySeconds: number;
    readonly isBeta: boolean;
    readonly isSupported: boolean;
}
