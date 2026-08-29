import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import type { AccountBalanceRepository } from '@budgie/contracts';

export class DebtMigrationBalanceAssertions {
    private static readonly DEBT_ACCOUNT_ID = Number('101');
    private static readonly DEFAULT_INSTRUMENT_ID = 2;
    private static readonly EXPECTED_OUTSTANDING_AMOUNT = Number('36934');
    private static readonly EXPECTED_PAID_AMOUNT = Number('8066');
    private static readonly EXPECTED_PERCENTAGE = Number('17.92');
    private static readonly EXPECTED_TOTAL_AMOUNT = Number('45000');

    constructor(private readonly repository: AccountBalanceRepository) {}

    assert(): void {
        const homeRow = this.repository
            .getHomeAccountRows(DebtMigrationBalanceAssertions.DEFAULT_INSTRUMENT_ID)
            .all()
            .find(row => row.account.id === DebtMigrationBalanceAssertions.DEBT_ACCOUNT_ID);
        const detailRow = this.repository.getDebtAccountProgressByAccountId(DebtMigrationBalanceAssertions.DEBT_ACCOUNT_ID).get();

        expect(homeRow).toBeDefined();
        expect(detailRow).toBeDefined();

        if (!isDefined(homeRow) || !isDefined(detailRow)) {
            throw new Error('Migrated debt progress was not hydrated');
        }

        expect(convertFromMicroUnits(detailRow.outstandingAmount)).toBe(DebtMigrationBalanceAssertions.EXPECTED_OUTSTANDING_AMOUNT);
        expect(convertFromMicroUnits(detailRow.paidAmount)).toBe(DebtMigrationBalanceAssertions.EXPECTED_PAID_AMOUNT);
        expect(convertFromMicroUnits(detailRow.totalAmount)).toBe(DebtMigrationBalanceAssertions.EXPECTED_TOTAL_AMOUNT);
        expect(detailRow.percentage).toBe(DebtMigrationBalanceAssertions.EXPECTED_PERCENTAGE);
        expect({
            outstandingAmount: homeRow.debtOutstandingAmount,
            paidAmount: homeRow.debtPaidAmount,
            percentage: homeRow.debtProgressPercentage,
            totalAmount: homeRow.debtTotalAmount
        }).toEqual({
            outstandingAmount: detailRow.outstandingAmount,
            paidAmount: detailRow.paidAmount,
            percentage: detailRow.percentage,
            totalAmount: detailRow.totalAmount
        });
    }
}
