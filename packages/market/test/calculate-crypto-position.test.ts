import { PRECISION, TransactionEntryTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { calculateCryptoPosition } from '../src/market-data/utils/calculate-crypto-position.util';

const buy = (amount: number, baseAmount: number | null) => ({ type: TransactionEntryTypeEnum.DEBIT, amount, baseAmount });

const sell = (amount: number) => ({ type: TransactionEntryTypeEnum.CREDIT, amount, baseAmount: null });

describe('calculateCryptoPosition', () => {
    it('returns an empty position without entries', () => {
        expect(calculateCryptoPosition([])).toStrictEqual({ costBasis: 0, averageCost: null });
    });

    it('sums the cost of every open lot', () => {
        expect(calculateCryptoPosition([buy(2 * PRECISION, 100 * PRECISION), buy(1 * PRECISION, 80 * PRECISION)])).toStrictEqual({
            costBasis: 180,
            averageCost: 60
        });
    });

    it('consumes the oldest lots first and prorates a partially sold lot', () => {
        const entries = [buy(2 * PRECISION, 100 * PRECISION), buy(4 * PRECISION, 400 * PRECISION), sell(3 * PRECISION)];

        expect(calculateCryptoPosition(entries)).toStrictEqual({ costBasis: 300, averageCost: 100 });
    });

    it('removes a lot sold exactly and ignores sells beyond the open amount', () => {
        expect(calculateCryptoPosition([buy(2 * PRECISION, 100 * PRECISION), sell(2 * PRECISION)])).toStrictEqual({
            costBasis: 0,
            averageCost: null
        });
        expect(
            calculateCryptoPosition([buy(1 * PRECISION, 50 * PRECISION), sell(5 * PRECISION), buy(1 * PRECISION, 70 * PRECISION)])
        ).toStrictEqual({
            costBasis: 70,
            averageCost: 70
        });
    });

    it('reports an unknown cost while an unvalued lot stays open', () => {
        expect(calculateCryptoPosition([buy(1 * PRECISION, null), buy(1 * PRECISION, 50 * PRECISION)])).toStrictEqual({
            costBasis: null,
            averageCost: null
        });
        expect(calculateCryptoPosition([buy(1 * PRECISION, null), buy(1 * PRECISION, 50 * PRECISION), sell(1 * PRECISION)])).toStrictEqual({
            costBasis: 50,
            averageCost: 50
        });
    });

    it('skips empty lots while consuming and does not mutate earlier results', () => {
        const entries = [buy(0, 0), buy(2 * PRECISION, 80 * PRECISION), sell(1 * PRECISION)];

        expect(calculateCryptoPosition(entries)).toStrictEqual({ costBasis: 40, averageCost: 40 });
        expect(calculateCryptoPosition(entries)).toStrictEqual({ costBasis: 40, averageCost: 40 });
    });
});
