import { isPositiveNumber } from '@rnw-community/shared';

import type { ConsolidationRunCapabilitiesRowInterface } from '../../query/interface/consolidation-run-capabilities-row.interface';

export class ConsolidationRunCapabilities {
    readonly hasIbanAccounts: boolean;
    readonly hasCryptoAccounts: boolean;
    readonly hasActiveCashAccounts: boolean;
    readonly hasApplePayOrReceipt: boolean;
    readonly hasManualExpenses: boolean;
    readonly hasMultipleActiveAccounts: boolean;

    private visibleExpenses: boolean;
    private visibleIncomes: boolean;
    private visibleTransfers: boolean;
    private ibanBridgeCanonicals: boolean;

    constructor(row: ConsolidationRunCapabilitiesRowInterface) {
        this.hasIbanAccounts = isPositiveNumber(row.hasIbanAccounts);
        this.hasCryptoAccounts = isPositiveNumber(row.hasCryptoAccounts);
        this.hasActiveCashAccounts = isPositiveNumber(row.hasActiveCashAccounts);
        this.hasApplePayOrReceipt = isPositiveNumber(row.hasApplePayOrReceipt);
        this.hasManualExpenses = isPositiveNumber(row.hasManualExpenses);
        this.hasMultipleActiveAccounts = isPositiveNumber(row.hasMultipleActiveAccounts);
        this.visibleExpenses = isPositiveNumber(row.hasVisibleExpenses);
        this.visibleIncomes = isPositiveNumber(row.hasVisibleIncomes);
        this.visibleTransfers = isPositiveNumber(row.hasVisibleTransfers);
        this.ibanBridgeCanonicals = isPositiveNumber(row.hasIbanBridgeCanonicals);
    }

    get hasVisibleExpenses(): boolean {
        return this.visibleExpenses;
    }

    get hasVisibleIncomes(): boolean {
        return this.visibleIncomes;
    }

    get hasVisibleTransfers(): boolean {
        return this.visibleTransfers;
    }

    get hasIbanBridgeCanonicals(): boolean {
        return this.ibanBridgeCanonicals;
    }

    markChanged(): void {
        this.visibleExpenses = true;
        this.visibleIncomes = true;
        this.visibleTransfers = true;
        this.ibanBridgeCanonicals = true;
    }
}
