import { convertToMicroUnits, CurrencyEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { isDefined } from '@rnw-community/shared';

import { parseReceipt } from '../../src/receipt/utils/parse-receipt.util';

import { receiptLine } from './fixture/receipt-line';

const rowsOf = (...texts: readonly string[]) => texts.map((text, index) => receiptLine(text, 0.06, 0.05 + index * 0.03));
const total = (amount: number, currency?: CurrencyEnum) => ({
    total: convertToMicroUnits(amount),
    ...(isDefined(currency) && { currency })
});

describe('parseReceipt hardening', () => {
    it.each([
        ['inclusive tax phrase (de)', rowsOf('Summe inkl. MwSt EUR 12,50'), total(12.5, CurrencyEnum.EUR)],
        ['inclusive tax phrase (en)', rowsOf('Total incl. tax 12.50 USD'), total(12.5, CurrencyEnum.USD)],
        ['parenthesized inclusive tax phrase', rowsOf('TOTAL (IVA incluido) 12,50 €'), total(12.5, CurrencyEnum.EUR)],
        ['tendered cash amount', rowsOf('Total 12.50', 'Amount tendered 20.00'), total(12.5)],
        ['NBSP thousands', rowsOf('СУМА 1 234,56 грн'), total(1234.56, CurrencyEnum.UAH)],
        ['space thousands', rowsOf('Total 1 234,56 €'), total(1234.56, CurrencyEnum.EUR)],
        ['narrow NBSP thousands', rowsOf('Total 1 234,56 €'), total(1234.56)],
        [
            'dot-decimal thousands',
            rowsOf('TOTAL 1,234.56 USD'),
            { total: convertToMicroUnits(1234.56), currency: CurrencyEnum.USD, occurredAt: null }
        ],
        ['comma-decimal thousands', rowsOf('Summe 1.234,56 EUR'), total(1234.56, CurrencyEnum.EUR)],
        ['VAT breakdown after the total (de)', rowsOf('Summe EUR 12,50 davon MwSt 20% 2,08'), total(12.5)],
        ['VAT breakdown after the total (fr)', rowsOf('Total TTC 12,50 € dont TVA 2,08 €'), total(12.5)],
        ['leading inclusive marker', rowsOf('Summe inkl. 20% MwSt EUR 12,50'), total(12.5, CurrencyEnum.EUR)],
        ['quantity total row', rowsOf('Total 2 x 6,25 12,50'), total(12.5)],
        ['cash word after the total label', rowsOf('Summe bar EUR 12,50'), total(12.5)],
        ['lowercase currency code', rowsOf('Total 12.50 eur'), { currency: CurrencyEnum.EUR }],
        ['currency code away from an amount', rowsOf('ALL PRICES INCL', 'Total 12.50'), { currency: CurrencyEnum.EUR }],
        ['currency code next to an amount', rowsOf('Total 12.50 USD'), { currency: CurrencyEnum.USD }],
        ['column-aligned currency code', rowsOf('Total USD           62.10'), total(62.1, CurrencyEnum.USD)],
        ['spaced receipt number label', rowsOf('Rechnung Nr. 2026-0042', 'Total 62.10'), { receiptNumber: '2026-0042' }],
        [
            'vertically offset label and value',
            [receiptLine('Total', 0.06, 0.1), receiptLine('12.50 EUR', 0.7, 0.107)],
            total(12.5, CurrencyEnum.EUR)
        ],
        ['date as receipt number', rowsOf('Receipt 27/10/2026', 'Total 12.50'), { receiptNumber: null }],
        [
            'time on the following row',
            rowsOf('Datum: 27.10.2026', 'Zeit: 14:32', 'Total 12,50 EUR'),
            { occurredAt: new Date(2026, 9, 27, 14, 32, 0) }
        ],
        ['two-digit year', rowsOf('Date 27.10.26', 'Total 12,50 EUR'), { occurredAt: new Date(2026, 9, 27) }],
        ['payment block above the total', rowsOf('Karte akzeptiert', 'Gesamt 10,00', 'Summe 12,50', 'Bankomat 10,00'), total(10)],
        ['grand total after tax', rowsOf('SUBTOTAL 56.00', 'TAX 10% 5.60', 'GRAND TOTAL 61.60'), total(61.6)],
        ['amount due label', rowsOf('Subtotal 23.50', 'Amount due 25.00'), total(25)],
        ['ringgit symbol', rowsOf('TOTAL RM 12.50'), total(12.5, CurrencyEnum.MYR)],
        ['koruna symbol', rowsOf('Total 125,00 Kč'), total(125, CurrencyEnum.CZK)],
        [
            'rounding confirmed by cash and change',
            rowsOf('TOTAL AMT 60.31', 'ROUNDING ADJ -0.01', 'CASH 70.30', 'CHANGE 10.00'),
            total(60.3)
        ],
        ['total after the rounding row', rowsOf('TOTAL INCL. GST 23.26', 'ROUNDING ADJ -0.01', 'TOTAL 23.25'), total(23.25)],
        [
            'total matching cash minus change',
            rowsOf('TOTAL 11.60', 'TOTAL INCLUSIVE GST: 10.45', 'CASH 20.00', 'CHANGE 9.55'),
            total(10.45)
        ],
        [
            'tax summary after the payment row',
            rowsOf('Total excl. GST 15.00', 'Total incl. GST 15.90', 'PAYMENT 50.00', 'GST 15.00 0.90'),
            total(15.9)
        ],
        ['excluding phrase in parentheses', rowsOf('TOTAL (EXCLUDING GST): 21.30', 'TOTAL (INCLUSIVE OF GST): 23.26'), total(23.26)],
        ['paid amount row', rowsOf('TOTAL AMT PAYABLE: 79.50', 'PAID AMOUNT: 100.00', 'CHANGE: 20.50'), total(79.5)],
        ['savings total row', rowsOf('TOTAL 100.60', 'TOTAL SAVING 150.00'), total(100.6)],
        ['percent tax breakdown row', rowsOf('TOTAL 0% SUPPLIES: 39.01', 'TOTAL PAYABLE: 20.21'), total(20.21)],
        ['punctuated subtotal label', rowsOf('Sub. Total 150.00', 'Total 145.90'), total(145.9)],
        ['includes tax phrase', rowsOf('TOTAL INCLUDES GST 6% 9.00'), total(9)],
        ['day month-name date', rowsOf('05 MAR 2018 18:24', 'Total 8.20'), { occurredAt: new Date(2018, 2, 5, 18, 24, 0) }],
        ['month-name day date', rowsOf('Oct 27, 2026', 'Total 8.20'), { occurredAt: new Date(2026, 9, 27) }],
        ['localized month-name date', rowsOf('27. Okt. 2026', 'Summe 8,20'), { occurredAt: new Date(2026, 9, 27) }],
        ['hyphenated date', rowsOf('DATE: 19-03-2018 18:08:38', 'Total 8.20'), { occurredAt: new Date(2018, 2, 19, 18, 8, 38) }],
        ['year-first slash date', rowsOf('2026/10/27', 'Total 8.20'), { occurredAt: new Date(2026, 9, 27) }],
        ['product code shaped like a date', rowsOf('CK 11-22-31', 'Total 8.20'), { occurredAt: null }],
        ['dotted phone number', rowsOf('TEL 05.22.95.66.66', 'Total 8.20'), { occurredAt: null }]
    ])('reads %s', (_name, lines, expected) => {
        expect(parseReceipt(lines, CurrencyEnum.EUR)).toMatchObject(expected);
    });

    it.each([
        ['dot-grouped rupiah total', rowsOf('TOTAL Rp 25.000'), CurrencyEnum.EUR, total(25000, CurrencyEnum.IDR)],
        ['comma-grouped integer total', rowsOf('SUBTOTAL 194,000', 'TOTAL 174,600'), CurrencyEnum.IDR, total(174600, CurrencyEnum.IDR)],
        ['cash after the total amount', rowsOf('Total: 20,000  Cash: 100,000'), CurrencyEnum.JPY, total(20000, CurrencyEnum.JPY)]
    ])('reads %s in a currency without minor units', (_name, lines, defaultCurrency, expected) => {
        expect(parseReceipt(lines, defaultCurrency)).toMatchObject(expected);
    });

    it.each([
        ['dinar total', rowsOf('TOTAL KWD 1.250'), CurrencyEnum.EUR],
        ['euro total', rowsOf('Summe 1.250 EUR'), CurrencyEnum.IDR],
        ['grouped total in the default currency', rowsOf('TOTAL 174,600'), CurrencyEnum.USD]
    ])('rejects a grouped integer %s', (_name, lines, defaultCurrency) => {
        expect(parseReceipt(lines, defaultCurrency)).toBeNull();
    });

    it('keeps two undated receipts with different numbers apart', () => {
        expect(parseReceipt(rowsOf('CAFE', 'Bon 101', 'Total 4.50'), CurrencyEnum.EUR)?.fingerprint).not.toBe(
            parseReceipt(rowsOf('CAFE', 'Bon 102', 'Total 4.50'), CurrencyEnum.EUR)?.fingerprint
        );
    });

    it.each([
        ['tax-total row (de)', rowsOf('MwSt-Summe 2,00')],
        ['tax-total row (en)', rowsOf('Tax total 4.18')],
        ['cash word before the total label', rowsOf('Bar Summe 20,00')],
        ['negative total with currency', rowsOf('Refund', 'Total -5,00 EUR')],
        ['negative total', rowsOf('Summe -5,00')],
        ['unconfirmed rounding', rowsOf('TOTAL 60.31', 'ROUNDING ADJ -0.01')],
        ['cash and change disagreeing with the total', rowsOf('TOTAL 20.00', 'CASH 50.00', 'CHANGE 20.00')],
        ['ungrouped integer total', rowsOf('TOTAL 91000')],
        ['quantity beside an amount', [receiptLine('TOTAL QTY: 9', 0.06, 0.1), receiptLine('327.00', 0.7, 0.1)]],
        [
            'text without a labelled total',
            rowsOf(
                'Team meeting notes',
                'Agenda for 27.10.2026 at 14:30',
                'Total attendees: 42',
                'Release 2.10 ships next week',
                'Action items: send summary to everyone'
            )
        ],
        ['no lines', []]
    ])('rejects %s', (_name, lines) => {
        expect(parseReceipt(lines, CurrencyEnum.EUR)).toBeNull();
    });
});
