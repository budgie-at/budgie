export interface BankIntegrationCapabilitiesInterface {
    readonly supportsLiveSync: boolean;
    readonly supportsFileImport: boolean;
    readonly supportsAddAccounts: boolean;
    readonly supportsDeposit: boolean;
}
