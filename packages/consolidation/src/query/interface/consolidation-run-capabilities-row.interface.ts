export interface ConsolidationRunCapabilitiesRowInterface {
    readonly hasVisibleExpenses: number;
    readonly hasVisibleIncomes: number;
    readonly hasVisibleTransfers: number;
    readonly hasIbanAccounts: number;
    readonly hasIbanBridgeCanonicals: number;
    readonly hasCryptoAccounts: number;
    readonly hasActiveCashAccounts: number;
    readonly hasApplePayOrReceipt: number;
    readonly hasManualExpenses: number;
    readonly hasHouseholdManualAccounts: number;
    readonly hasMultipleActiveAccounts: number;
}
