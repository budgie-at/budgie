export interface BankIntegrationCapabilitiesInterface {
    readonly supportsLiveSync: boolean;
    readonly supportsFileImport: boolean;
    readonly supportsAccountDiscovery: boolean;
    readonly supportsDeposit: boolean;
}
