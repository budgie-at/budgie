import { isPositiveNumber } from '@rnw-community/shared';

import type { ConsolidationRunCapabilitiesRowInterface } from '../../query/interface/consolidation-run-capabilities-row.interface';

export class ConsolidationRunCapabilities {
    private visibleExpenses: boolean;
    private visibleIncomes: boolean;
    private visibleTransfers: boolean;
    private ibanAccounts: boolean;
    private ibanBridgeCanonicals: boolean;
    private cryptoAccounts: boolean;
    private activeCashAccounts: boolean;
    private applePayOrReceipt: boolean;
    private manualExpenses: boolean;
    private householdManualAccounts: boolean;
    private multipleActiveAccounts: boolean;

    constructor(row: ConsolidationRunCapabilitiesRowInterface) {
        this.visibleExpenses = isPositiveNumber(row.hasVisibleExpenses);
        this.visibleIncomes = isPositiveNumber(row.hasVisibleIncomes);
        this.visibleTransfers = isPositiveNumber(row.hasVisibleTransfers);
        this.ibanAccounts = isPositiveNumber(row.hasIbanAccounts);
        this.ibanBridgeCanonicals = isPositiveNumber(row.hasIbanBridgeCanonicals);
        this.cryptoAccounts = isPositiveNumber(row.hasCryptoAccounts);
        this.activeCashAccounts = isPositiveNumber(row.hasActiveCashAccounts);
        this.applePayOrReceipt = isPositiveNumber(row.hasApplePayOrReceipt);
        this.manualExpenses = isPositiveNumber(row.hasManualExpenses);
        this.householdManualAccounts = isPositiveNumber(row.hasHouseholdManualAccounts);
        this.multipleActiveAccounts = isPositiveNumber(row.hasMultipleActiveAccounts);
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

    get hasIbanAccounts(): boolean {
        return this.ibanAccounts;
    }

    get hasIbanBridgeCanonicals(): boolean {
        return this.ibanBridgeCanonicals;
    }

    get hasCryptoAccounts(): boolean {
        return this.cryptoAccounts;
    }

    get hasActiveCashAccounts(): boolean {
        return this.activeCashAccounts;
    }

    get hasApplePayOrReceipt(): boolean {
        return this.applePayOrReceipt;
    }

    get hasManualExpenses(): boolean {
        return this.manualExpenses;
    }

    get hasHouseholdManualAccounts(): boolean {
        return this.householdManualAccounts;
    }

    get hasMultipleActiveAccounts(): boolean {
        return this.multipleActiveAccounts;
    }

    markTransfersCreated(): void {
        this.visibleTransfers = true;
        this.ibanBridgeCanonicals = true;
    }

    markSourcesReleased(): void {
        this.visibleExpenses = true;
        this.visibleIncomes = true;
    }
}
