import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { AccountBalanceRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

export class DebtMigrationBalanceAssertions {
    private static readonly DEBT_ACCOUNT_ID = Number('101');
    private static readonly DEFAULT_INSTRUMENT_ID = 2;
    private static readonly EXPECTED_OUTSTANDING_AMOUNT = Number('36934');
    private static readonly EXPECTED_PAID_AMOUNT = Number('8066');
    private static readonly EXPECTED_PERCENTAGE = Number('17.92');
    private static readonly EXPECTED_TOTAL_AMOUNT = Number('45000');

    assert() {
        return Effect.gen({ self: this }, function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const homeRow = (yield* accountBalanceRepository.getHomeAccountRows(DebtMigrationBalanceAssertions.DEFAULT_INSTRUMENT_ID)).find(
                row => row.account.id === DebtMigrationBalanceAssertions.DEBT_ACCOUNT_ID
            );
            const detailRow = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(
                DebtMigrationBalanceAssertions.DEBT_ACCOUNT_ID
            )).at(0);

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
        });
    }
}
