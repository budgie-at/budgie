import { describe, expect, it } from '@jest/globals';

import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';

import { getDebtClosedAmount } from './get-debt-closed-amount.util';
import { getDebtLedgerBalance } from './get-debt-ledger-balance.util';

describe('getDebtLedgerBalance', () => {
    it('stores a borrow debt as the negative remaining balance', () => {
        expect(getDebtLedgerBalance(7_934, AccountDebtTypeEnum.BORROW, 45_000)).toBe(-37_066);
    });

    it('stores a fresh borrow without returns as the full target', () => {
        expect(getDebtLedgerBalance(0, AccountDebtTypeEnum.BORROW, 45_000)).toBe(-45_000);
    });

    it('clamps the borrow ledger balance at zero once fully repaid', () => {
        expect(getDebtLedgerBalance(45_000, AccountDebtTypeEnum.BORROW, 45_000)).toBe(0);
        expect(getDebtLedgerBalance(50_000, AccountDebtTypeEnum.BORROW, 45_000)).toBe(0);
    });

    it('stores a lent debt as the received amount', () => {
        expect(getDebtLedgerBalance(2_000, AccountDebtTypeEnum.LENT, 15_000)).toBe(2_000);
    });

    it('caps the lent ledger balance at the target once overpaid', () => {
        expect(getDebtLedgerBalance(20_000, AccountDebtTypeEnum.LENT, 15_000)).toBe(15_000);
        expect(getDebtLedgerBalance(-20_000, AccountDebtTypeEnum.LENT, 15_000)).toBe(15_000);
    });

    it('reproduces the same balance when replayed from the capped closed amount', () => {
        const cappedClosedAmount = getDebtClosedAmount(20_000, 15_000);

        expect(getDebtLedgerBalance(cappedClosedAmount, AccountDebtTypeEnum.LENT, 15_000)).toBe(15_000);
        expect(getDebtLedgerBalance(cappedClosedAmount, AccountDebtTypeEnum.BORROW, 15_000)).toBe(0);
    });

    it('ignores the sign of the entered returned amount', () => {
        expect(getDebtLedgerBalance(-7_934, AccountDebtTypeEnum.BORROW, 45_000)).toBe(-37_066);
        expect(getDebtLedgerBalance(-2_000, AccountDebtTypeEnum.LENT, 15_000)).toBe(2_000);
    });
});
