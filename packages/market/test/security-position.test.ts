import { PRECISION, TransactionEntryTypeEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { calculateInstrumentPosition } from '../src/market-data/utils/calculate-instrument-position.util';

const opening = { type: TransactionEntryTypeEnum.DEBIT, amount: 2 * PRECISION, baseAmount: 100 * PRECISION };

it.effect('reports realized FIFO profit after a partial sale', () =>
    Effect.sync(() => {
        expect(
            calculateInstrumentPosition([
                opening,
                { type: TransactionEntryTypeEnum.DEBIT, amount: 2 * PRECISION, baseAmount: 200 * PRECISION },
                { type: TransactionEntryTypeEnum.CREDIT, amount: 3 * PRECISION, baseAmount: 300 * PRECISION }
            ])
        ).toMatchObject({ amount: 1, costBasis: 100, realizedProfitLoss: 100 });
    })
);

it.effect('adds purchase fees and subtracts sale fees', () =>
    Effect.sync(() => {
        expect(
            calculateInstrumentPosition([
                { type: TransactionEntryTypeEnum.DEBIT, amount: 2 * PRECISION, baseAmount: 100 * PRECISION, feeBaseAmount: 2 * PRECISION },
                { type: TransactionEntryTypeEnum.CREDIT, amount: PRECISION, baseAmount: 80 * PRECISION, feeBaseAmount: 3 * PRECISION }
            ])
        ).toMatchObject({ amount: 1, costBasis: 51, realizedProfitLoss: 26 });
    })
);

it.effect('preserves total cost after a split quantity adjustment', () =>
    Effect.sync(() => {
        expect(
            calculateInstrumentPosition([
                opening,
                { type: TransactionEntryTypeEnum.DEBIT, amount: 2 * PRECISION, baseAmount: 0, isAdjustment: true }
            ])
        ).toMatchObject({ amount: 4, costBasis: 100, averageCost: 25 });
    })
);

it.effect('preserves cost and realized return through reverse splits and quantity fixes', () =>
    Effect.sync(() => {
        expect(
            calculateInstrumentPosition([
                opening,
                { type: TransactionEntryTypeEnum.CREDIT, amount: PRECISION, baseAmount: 0, isAdjustment: true },
                { type: TransactionEntryTypeEnum.CREDIT, amount: PRECISION / 2, baseAmount: 0, isAdjustment: true },
                { type: TransactionEntryTypeEnum.CREDIT, amount: PRECISION / 4, baseAmount: 70 * PRECISION }
            ])
        ).toMatchObject({ amount: 0.25, costBasis: 50, realizedProfitLoss: 20 });
        expect(
            calculateInstrumentPosition([
                opening,
                { type: TransactionEntryTypeEnum.CREDIT, amount: 2 * PRECISION, baseAmount: 0, isAdjustment: true }
            ])
        ).toMatchObject({ amount: 0, costBasis: null, realizedProfitLoss: 0 });
    })
);

it.effect('rescales split lots before a FIFO sale', () =>
    Effect.sync(() => {
        expect(
            calculateInstrumentPosition([
                opening,
                { type: TransactionEntryTypeEnum.DEBIT, amount: 2 * PRECISION, baseAmount: 0, isAdjustment: true },
                { type: TransactionEntryTypeEnum.CREDIT, amount: 2 * PRECISION, baseAmount: 60 * PRECISION }
            ])
        ).toMatchObject({ amount: 2, costBasis: 50, realizedProfitLoss: 10 });
    })
);

it.effect('carries original FIFO cost between accounts and realizes profit in the destination scope', () =>
    Effect.sync(() => {
        const entries = [
            { ...opening, accountId: 1, amount: PRECISION },
            { accountId: 1, transferAccountId: 2, type: TransactionEntryTypeEnum.CREDIT, amount: PRECISION, baseAmount: 150 * PRECISION },
            { accountId: 2, transferAccountId: 1, type: TransactionEntryTypeEnum.DEBIT, amount: PRECISION, baseAmount: 150 * PRECISION },
            { accountId: 2, type: TransactionEntryTypeEnum.CREDIT, amount: PRECISION, baseAmount: 160 * PRECISION }
        ];
        expect(calculateInstrumentPosition(entries, [2])).toMatchObject({ amount: 0, realizedProfitLoss: 60 });
        expect(calculateInstrumentPosition(entries, [1])).toMatchObject({ amount: 0, realizedProfitLoss: 0 });
    })
);

it.effect('keeps known crypto cost when a negative adjustment consumes an unknown opening lot', () =>
    Effect.sync(() => {
        expect(
            calculateInstrumentPosition([
                { type: TransactionEntryTypeEnum.DEBIT, amount: PRECISION, baseAmount: null, isAdjustment: true },
                { type: TransactionEntryTypeEnum.DEBIT, amount: PRECISION, baseAmount: 100 * PRECISION },
                { type: TransactionEntryTypeEnum.CREDIT, amount: PRECISION / 10, baseAmount: null, isAdjustment: true }
            ])
        ).toMatchObject({ amount: 1, costBasis: 100, realizedProfitLoss: 0 });
    })
);

it.effect('rescales every FIFO lot in a reverse split without moving cost between lots', () =>
    Effect.sync(() => {
        expect(
            calculateInstrumentPosition([
                opening,
                { type: TransactionEntryTypeEnum.DEBIT, amount: 2 * PRECISION, baseAmount: 200 * PRECISION },
                { type: TransactionEntryTypeEnum.CREDIT, amount: 2 * PRECISION, baseAmount: 0, isAdjustment: true },
                { type: TransactionEntryTypeEnum.CREDIT, amount: PRECISION, baseAmount: 160 * PRECISION }
            ])
        ).toMatchObject({ amount: 1, costBasis: 200, realizedProfitLoss: 60 });
    })
);
