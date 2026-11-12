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
            calculateInstrumentPosition([opening, { type: TransactionEntryTypeEnum.DEBIT, amount: 2 * PRECISION, baseAmount: 0 }])
        ).toMatchObject({ amount: 4, costBasis: 100, averageCost: 25 });
    })
);
