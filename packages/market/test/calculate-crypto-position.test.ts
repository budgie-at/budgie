import { PRECISION, TransactionEntryTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { calculateInstrumentPosition } from '../src/market-data/utils/calculate-instrument-position.util';

const buy = (amount: number, baseAmount: number | null) => ({ type: TransactionEntryTypeEnum.DEBIT, amount, baseAmount });

const sell = (amount: number) => ({ type: TransactionEntryTypeEnum.CREDIT, amount, baseAmount: null });

describe('calculateInstrumentPosition', () => {
    it('returns an empty position without entries', () => {
        expect(calculateInstrumentPosition([])).toStrictEqual({ realizedProfitLoss: 0, amount: 0, costBasis: null, averageCost: null });
    });

    it('sums the cost of every open lot', () => {
        expect(calculateInstrumentPosition([buy(2 * PRECISION, 100 * PRECISION), buy(PRECISION, 80 * PRECISION)])).toStrictEqual({
            realizedProfitLoss: 0,
            amount: 3,
            costBasis: 180,
            averageCost: 60
        });
    });

    it('consumes the oldest lots first and prorates a partially sold lot', () => {
        const entries = [buy(2 * PRECISION, 100 * PRECISION), buy(4 * PRECISION, 400 * PRECISION), sell(3 * PRECISION)];

        expect(calculateInstrumentPosition(entries)).toStrictEqual({ realizedProfitLoss: 0, amount: 3, costBasis: 300, averageCost: 100 });
    });

    it('removes a lot sold exactly and ignores sells beyond the open amount', () => {
        expect(calculateInstrumentPosition([buy(2 * PRECISION, 100 * PRECISION), sell(2 * PRECISION)])).toStrictEqual({
            realizedProfitLoss: 0,
            amount: 0,
            costBasis: null,
            averageCost: null
        });
        expect(
            calculateInstrumentPosition([buy(PRECISION, 50 * PRECISION), sell(5 * PRECISION), buy(PRECISION, 70 * PRECISION)])
        ).toStrictEqual({ realizedProfitLoss: 0, amount: 1, costBasis: 70, averageCost: 70 });
    });

    it('costs only the open lots with a known purchase price', () => {
        expect(calculateInstrumentPosition([buy(PRECISION, null), buy(PRECISION, 50 * PRECISION)])).toStrictEqual({
            realizedProfitLoss: 0,
            amount: 1,
            costBasis: 50,
            averageCost: 50
        });
        expect(calculateInstrumentPosition([buy(PRECISION, null)])).toStrictEqual({
            realizedProfitLoss: 0,
            amount: 0,
            costBasis: null,
            averageCost: null
        });
        expect(calculateInstrumentPosition([buy(PRECISION, null), buy(PRECISION, 50 * PRECISION), sell(PRECISION)])).toStrictEqual({
            realizedProfitLoss: 0,
            amount: 1,
            costBasis: 50,
            averageCost: 50
        });
    });

    it('skips empty lots while consuming and does not mutate earlier results', () => {
        const entries = [buy(0, 0), buy(2 * PRECISION, 80 * PRECISION), sell(PRECISION)];

        expect(calculateInstrumentPosition(entries)).toStrictEqual({ realizedProfitLoss: 0, amount: 1, costBasis: 40, averageCost: 40 });
        expect(calculateInstrumentPosition(entries)).toStrictEqual({ realizedProfitLoss: 0, amount: 1, costBasis: 40, averageCost: 40 });
    });

    it('reports the open amount after a partial sell', () => {
        expect(calculateInstrumentPosition([buy(5 * PRECISION, 100 * PRECISION), sell(2 * PRECISION)]).amount).toBe(3);
    });

    it('ignores zero-size lots when costing the position', () => {
        expect(calculateInstrumentPosition([buy(0, 0), buy(PRECISION, null)])).toStrictEqual({
            realizedProfitLoss: 0,
            amount: 0,
            costBasis: null,
            averageCost: null
        });
    });
});
