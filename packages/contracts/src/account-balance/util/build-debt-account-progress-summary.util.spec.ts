import { describe, expect, it } from '@jest/globals';

import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';

import { buildDebtAccountProgressSummary } from './build-debt-account-progress-summary.util';

const EMPTY_MOVEMENT = {
    closedAmount: 0,
    openedExtraAmount: 0,
    openedPrincipalAmount: 0
};

describe('buildDebtAccountProgressSummary', () => {
    it('treats a borrow debt without movements as fully outstanding', () => {
        const summary = buildDebtAccountProgressSummary({
            ...EMPTY_MOVEMENT,
            balance: 0,
            debtType: AccountDebtTypeEnum.BORROW,
            targetAmount: 45_000
        });

        expect(summary.outstandingAmount).toBe(45_000);
        expect(summary.totalAmount).toBe(45_000);
        expect(summary.paidAmount).toBe(0);
        expect(summary.percentage).toBe(0);
    });

    it('keeps borrow outstanding and repaid amounts apart for a negative ledger balance', () => {
        const summary = buildDebtAccountProgressSummary({
            ...EMPTY_MOVEMENT,
            balance: -37_066,
            closedAmount: 7_934,
            debtType: AccountDebtTypeEnum.BORROW,
            targetAmount: 45_000
        });

        expect(summary.outstandingAmount).toBe(37_066);
        expect(summary.paidAmount).toBe(7_934);
        expect(summary.totalAmount).toBe(45_000);
        expect(summary.percentage).toBe(17.63);
    });

    it('counts lent repayments toward the total', () => {
        const summary = buildDebtAccountProgressSummary({
            ...EMPTY_MOVEMENT,
            balance: 2_000,
            debtType: AccountDebtTypeEnum.LENT,
            targetAmount: 15_000
        });

        expect(summary.outstandingAmount).toBe(13_000);
        expect(summary.paidAmount).toBe(2_000);
        expect(summary.totalAmount).toBe(15_000);
        expect(summary.percentage).toBe(13.33);
    });

    it('treats a fully repaid borrow debt as hundred percent', () => {
        const summary = buildDebtAccountProgressSummary({
            ...EMPTY_MOVEMENT,
            balance: 0,
            closedAmount: 45_000,
            debtType: AccountDebtTypeEnum.BORROW,
            targetAmount: 45_000
        });

        expect(summary.outstandingAmount).toBe(0);
        expect(summary.percentage).toBe(100);
    });

    it('returns zero percentage for a zero target', () => {
        const summary = buildDebtAccountProgressSummary({
            ...EMPTY_MOVEMENT,
            balance: 0,
            debtType: AccountDebtTypeEnum.LENT,
            targetAmount: 0
        });

        expect(summary.percentage).toBe(0);
        expect(summary.outstandingAmount).toBe(0);
    });
});
