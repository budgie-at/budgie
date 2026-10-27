import { convertToMicroUnits, CurrencyEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { parseReceipt } from '../../src/receipt/utils/parse-receipt.util';

import { receiptLine } from './fixture/receipt-line';

const rowsOf = (...texts: readonly string[]) => texts.map((text, index) => receiptLine(text, 0.06, 0.05 + index * 0.03));

describe('parseReceipt hardening', () => {
    it.effect('keeps totals whose row mentions an inclusive tax phrase', () =>
        Effect.sync(() => {
            expect(parseReceipt(rowsOf('Summe inkl. MwSt EUR 12,50'))).toMatchObject({
                total: convertToMicroUnits(12.5),
                currency: CurrencyEnum.EUR
            });
            expect(parseReceipt(rowsOf('Total incl. tax 12.50 USD'))).toMatchObject({
                total: convertToMicroUnits(12.5),
                currency: CurrencyEnum.USD
            });
            expect(parseReceipt(rowsOf('TOTAL (IVA incluido) 12,50 €'))).toMatchObject({
                total: convertToMicroUnits(12.5),
                currency: CurrencyEnum.EUR
            });
        })
    );

    it.effect('still excludes tax-total rows', () =>
        Effect.sync(() => {
            expect(parseReceipt(rowsOf('MwSt-Summe 2,00'))).toBeNull();
            expect(parseReceipt(rowsOf('Tax total 4.18'))).toBeNull();
        })
    );

    it.effect('ignores tendered cash amounts', () =>
        Effect.sync(() => {
            expect(parseReceipt(rowsOf('Total 12.50', 'Amount tendered 20.00'))).toMatchObject({ total: convertToMicroUnits(12.5) });
        })
    );

    it.effect('does not merge a quantity into the amount through a space', () =>
        Effect.sync(() => {
            expect(parseReceipt(rowsOf('Total 3 100.00'))).toMatchObject({ total: convertToMicroUnits(100) });
        })
    );

    it.effect('detects currency codes only next to an amount', () =>
        Effect.sync(() => {
            expect(parseReceipt(rowsOf('ALL PRICES INCL', 'Total 12.50'))).toMatchObject({ currency: null });
            expect(parseReceipt(rowsOf('Total 12.50 USD'))).toMatchObject({ currency: CurrencyEnum.USD });
        })
    );

    it.effect('joins a label and value that are slightly offset vertically', () =>
        Effect.sync(() => {
            const draft = parseReceipt([receiptLine('Total', 0.06, 0.1), receiptLine('12.50 EUR', 0.7, 0.107)]);

            expect(draft).toMatchObject({ total: convertToMicroUnits(12.5), currency: CurrencyEnum.EUR });
        })
    );

    it.effect('rejects a date as the receipt number', () =>
        Effect.sync(() => {
            expect(parseReceipt(rowsOf('Receipt 27/10/2026', 'Total 12.50'))).toMatchObject({ receiptNumber: null });
        })
    );

    it.effect('reads the time from the following row and two-digit years', () =>
        Effect.sync(() => {
            expect(parseReceipt(rowsOf('Datum: 27.10.2026', 'Zeit: 14:32', 'Total 12,50 EUR'))).toMatchObject({
                occurredAt: new Date(2026, 9, 27, 14, 32, 0)
            });
            expect(parseReceipt(rowsOf('Date 27.10.26', 'Total 12,50 EUR'))).toMatchObject({ occurredAt: new Date(2026, 9, 27) });
        })
    );

    it.effect('searches for the payment block only below the total row', () =>
        Effect.sync(() => {
            const draft = parseReceipt(rowsOf('Karte akzeptiert', 'Gesamt 10,00', 'Summe 12,50', 'Bankomat 10,00'));

            expect(draft).toMatchObject({ total: convertToMicroUnits(10) });
        })
    );

    it.effect('returns null for negative totals', () =>
        Effect.sync(() => {
            expect(parseReceipt(rowsOf('Refund', 'Total -5,00 EUR'))).toBeNull();
            expect(parseReceipt(rowsOf('Summe -5,00'))).toBeNull();
        })
    );
});
