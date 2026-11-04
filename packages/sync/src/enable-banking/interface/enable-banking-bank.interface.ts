export interface EnableBankingBankInterface {
    readonly name: string;
    readonly country: string;
    readonly logoUrl: string | null;
    readonly maximumConsentValiditySeconds: number;
    readonly isBeta: boolean;
    readonly isSupported: boolean;
}
