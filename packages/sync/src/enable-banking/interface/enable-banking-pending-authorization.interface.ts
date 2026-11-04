export interface EnableBankingPendingAuthorizationInterface {
    readonly state: string;
    readonly applicationId: string;
    readonly aspspName: string;
    readonly aspspCountry: string;
    readonly integrationId: number | null;
    readonly callbackUrl: string;
    readonly expiresAtMs: number;
}
