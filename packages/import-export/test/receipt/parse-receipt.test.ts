import { convertToMicroUnits, CurrencyEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { parseReceipt } from '../../src/receipt/utils/parse-receipt.util';

import { BILLA_RECEIPT } from './fixture/billa-receipt.fixture';
import { IHR_LABOR_LEGAL_NAME, IHR_LABOR_RECEIPT } from './fixture/ihr-labor-receipt.fixture';
import { NON_RECEIPT_TEXT } from './fixture/non-receipt-text.fixture';
import { receiptLine } from './fixture/receipt-line';
import { UKRAINIAN_FISCAL_RECEIPT } from './fixture/ukrainian-fiscal-receipt.fixture';
import { USD_TIP_RECEIPT } from './fixture/usd-tip-receipt.fixture';

describe('parseReceipt', () => {
    it.effect('reads the IHR LABOR invoice and ignores ids, VAT zeroes and terminal numbers', () =>
        Effect.sync(() => {
            const draft = parseReceipt(IHR_LABOR_RECEIPT);

            expect(draft).toMatchObject({
                total: 62_100_000,
                currency: CurrencyEnum.EUR,
                occurredAt: new Date(2026, 9, 27, 7, 52, 7),
                cardLast4: '9271',
                receiptNumber: 'K2310000301/26-010863',
                merchantVatId: 'ATU71427716',
                merchantLegalName: IHR_LABOR_LEGAL_NAME,
                fingerprint: 'ATU71427716|K2310000301/26-010863|62100000|2026-10-27'
            });
            expect(draft?.merchantCandidates.at(0)).toBe('IHR LABOR');
            expect(draft?.merchantCandidates).toContain(IHR_LABOR_LEGAL_NAME);
        })
    );

    it.effect('reads an Austrian supermarket receipt and skips the subtotal', () =>
        Effect.sync(() => {
            expect(parseReceipt(BILLA_RECEIPT)).toEqual({
                total: convertToMicroUnits(18.45),
                currency: CurrencyEnum.EUR,
                occurredAt: new Date(2026, 9, 27, 18, 3, 0),
                cardLast4: '3318',
                receiptNumber: '4711',
                merchantVatId: 'ATU12345678',
                merchantLegalName: 'BILLA AG',
                merchantCandidates: ['BILLA', 'BILLA AG'],
                fingerprint: 'ATU12345678|4711|18450000|2026-10-27'
            });
        })
    );

    it.effect('reads a Ukrainian fiscal receipt and ignores the VAT line and register number', () =>
        Effect.sync(() => {
            const draft = parseReceipt(UKRAINIAN_FISCAL_RECEIPT);

            expect(draft).toMatchObject({
                total: convertToMicroUnits(184.05),
                currency: CurrencyEnum.UAH,
                occurredAt: new Date(2026, 9, 27, 18, 41, 9),
                cardLast4: '5512',
                receiptNumber: '0012345',
                merchantVatId: '300123456789',
                merchantLegalName: 'ТОВ "АТБ-МАРКЕТ"',
                fingerprint: '300123456789|0012345|184050000|2026-10-27'
            });
            expect(draft?.merchantCandidates.at(0)).toBe('ТОВ "АТБ-МАРКЕТ"');
        })
    );

    it.effect('takes the after-tip total of a USD receipt and falls back to a merchant fingerprint', () =>
        Effect.sync(() => {
            expect(parseReceipt(USD_TIP_RECEIPT)).toEqual({
                total: convertToMicroUnits(62.68),
                currency: CurrencyEnum.USD,
                occurredAt: new Date(2026, 9, 27, 20, 14, 0),
                cardLast4: '7730',
                receiptNumber: '1047',
                merchantVatId: null,
                merchantLegalName: null,
                merchantCandidates: ['THE GOLDEN SPOON', 'Bistro & Bar'],
                fingerprint: 'thegoldenspoon|62680000|2026-10-27|20:14'
            });
        })
    );

    it.effect('parses both decimal conventions with thousands separators', () =>
        Effect.sync(() => {
            const dotDecimal = parseReceipt([receiptLine('TOTAL', 0.06, 0.1), receiptLine('1,234.56 USD', 0.7, 0.1)]);
            const commaDecimal = parseReceipt([receiptLine('Summe', 0.06, 0.1), receiptLine('1.234,56 EUR', 0.7, 0.1)]);

            expect(dotDecimal).toMatchObject({ total: convertToMicroUnits(1234.56), currency: CurrencyEnum.USD, occurredAt: null });
            expect(commaDecimal).toMatchObject({ total: convertToMicroUnits(1234.56), currency: CurrencyEnum.EUR });
        })
    );

    it.effect('returns null for text without a labelled total', () =>
        Effect.sync(() => {
            expect(parseReceipt(NON_RECEIPT_TEXT)).toBeNull();
            expect(parseReceipt([])).toBeNull();
        })
    );
});
