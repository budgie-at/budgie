import { convertToMicroUnits, CurrencyEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { parseReceipt } from '../../src/receipt/utils/parse-receipt.util';

import { BILLA_RECEIPT } from './fixture/billa-receipt.fixture';
import { CORD_RECEIPTS } from './fixture/cord-receipts.fixture';
import { E2E_SHARED_RECEIPT } from './fixture/e2e-shared-receipt.fixture';
import { IHR_LABOR_LEGAL_NAME, IHR_LABOR_RECEIPT } from './fixture/ihr-labor-receipt.fixture';
import { RESTAURANT_TABLE_BILL_RECEIPT } from './fixture/restaurant-table-bill-receipt.fixture';
import { SCHWEDEN_APOTHEKE_PHOTO_RECEIPT } from './fixture/schweden-apotheke-photo-receipt.fixture';
import { SMYTHS_CASH_RECEIPT } from './fixture/smyths-cash-receipt.fixture';
import { UKRAINIAN_FISCAL_RECEIPT } from './fixture/ukrainian-fiscal-receipt.fixture';
import { USD_TIP_RECEIPT } from './fixture/usd-tip-receipt.fixture';

describe('parseReceipt', () => {
    it.each([
        [
            'the IHR LABOR invoice, ignoring ids, VAT zeroes and terminal numbers',
            IHR_LABOR_RECEIPT,
            {
                total: convertToMicroUnits(62.1),
                currency: CurrencyEnum.EUR,
                occurredAt: new Date(2026, 9, 27, 7, 52, 7),
                cardLast4: '9271',
                receiptNumber: 'K2310000301/26-010863',
                merchantVatId: 'ATU71427716',
                merchantLegalName: IHR_LABOR_LEGAL_NAME,
                merchantCandidates: ['IHR LABOR', 'Qualität, ganz persönlich.', 'ALLE KASSEN. IHRLABOR.AT', IHR_LABOR_LEGAL_NAME],
                isPaid: true,
                fingerprint: 'ATU71427716|K2310000301/26-010863|62100000|2026-10-27'
            }
        ],
        [
            'an Austrian supermarket receipt, skipping the subtotal',
            BILLA_RECEIPT,
            {
                total: convertToMicroUnits(18.45),
                currency: CurrencyEnum.EUR,
                occurredAt: new Date(2026, 9, 27, 18, 3, 0),
                cardLast4: '3318',
                receiptNumber: '4711',
                merchantVatId: 'ATU12345678',
                merchantLegalName: 'BILLA AG',
                merchantCandidates: ['BILLA', 'BILLA AG'],
                isPaid: true,
                fingerprint: 'ATU12345678|4711|18450000|2026-10-27'
            }
        ],
        [
            'a Ukrainian fiscal receipt, ignoring the VAT line and register number',
            UKRAINIAN_FISCAL_RECEIPT,
            {
                total: convertToMicroUnits(184.05),
                currency: CurrencyEnum.UAH,
                occurredAt: new Date(2026, 9, 27, 18, 41, 9),
                cardLast4: '5512',
                receiptNumber: '0012345',
                merchantVatId: '300123456789',
                merchantLegalName: 'ТОВ "АТБ-МАРКЕТ"',
                merchantCandidates: ['ТОВ "АТБ-МАРКЕТ"', 'м. Дніпро, вул. Шевченка, 15'],
                isPaid: true,
                fingerprint: '300123456789|0012345|184050000|2026-10-27'
            }
        ],
        [
            'the after-tip total of a USD receipt with a merchant fingerprint',
            USD_TIP_RECEIPT,
            {
                total: convertToMicroUnits(62.68),
                currency: CurrencyEnum.USD,
                occurredAt: new Date(2026, 9, 27, 20, 14, 0),
                cardLast4: '7730',
                receiptNumber: '1047',
                merchantVatId: null,
                merchantLegalName: null,
                merchantCandidates: ['THE GOLDEN SPOON', 'Bistro & Bar'],
                isPaid: true,
                fingerprint: 'thegoldenspoon|62680000|2026-10-27|20:14|1047'
            }
        ],
        [
            'the dateless E2E receipt PDF with a USD total',
            E2E_SHARED_RECEIPT,
            {
                total: convertToMicroUnits(62.1),
                currency: CurrencyEnum.USD,
                occurredAt: null,
                cardLast4: null,
                receiptNumber: '2026-0042',
                merchantVatId: 'ATU12345678',
                merchantLegalName: 'Ihr Labor GmbH',
                merchantCandidates: ['IHR LABOR', 'Ihr Labor GmbH'],
                isPaid: true,
                fingerprint: 'ATU12345678|2026-0042|62100000|'
            }
        ],
        [
            'an uncropped gallery photo with a compound Rechnungsbetrag total',
            SCHWEDEN_APOTHEKE_PHOTO_RECEIPT,
            {
                total: convertToMicroUnits(29.8),
                currency: CurrencyEnum.EUR,
                occurredAt: new Date(2026, 9, 29, 14, 33, 47),
                cardLast4: '4242',
                receiptNumber: '7799',
                merchantVatId: 'ATU10227100',
                merchantLegalName: 'Mag. pharm. Christof Ulrich KG',
                merchantCandidates: ['APOTHEKE', 'Schweden Apotheke', 'Mag. pharm. Christof Ulrich KG'],
                isPaid: true,
                fingerprint: 'ATU10227100|7799|29800000|2026-10-29'
            }
        ],
        [
            'an unpaid restaurant table bill without merchant, date or payment',
            RESTAURANT_TABLE_BILL_RECEIPT,
            {
                total: convertToMicroUnits(128.9),
                currency: CurrencyEnum.EUR,
                occurredAt: null,
                cardLast4: null,
                receiptNumber: null,
                merchantVatId: null,
                merchantLegalName: null,
                merchantCandidates: ['Ausdruck Gruppe:', 'Tisch:', 'Stk Artikelname'],
                isPaid: false,
                fingerprint: 'ausdruckgruppe|128900000||'
            }
        ],
        [
            'a cash-paid toy store receipt with a tabular receipt number and an m.b.H. legal name',
            SMYTHS_CASH_RECEIPT,
            {
                total: convertToMicroUnits(96.96),
                currency: CurrencyEnum.EUR,
                occurredAt: new Date(2026, 9, 31, 14, 8, 0),
                cardLast4: null,
                receiptNumber: '00222',
                merchantVatId: 'ATU22547304',
                merchantLegalName: 'Smyths Toys Handelsges. m.b.H.',
                merchantCandidates: ['SMYTHS', 'TOYS SUPERSTORES', 'Smyths Toys Handelsges. m.b.H.'],
                isPaid: true,
                fingerprint: 'ATU22547304|00222|96960000|2026-10-31'
            }
        ]
    ])('reads %s', (_name, lines, expected) => {
        expect(parseReceipt(lines, CurrencyEnum.EUR)).toEqual(expected);
    });

    it.each([
        ['comma thousands confirmed by cash and change', CORD_RECEIPTS.commaThousandsWithChange, 174600],
        ['the grand total after a tax row', CORD_RECEIPTS.grandTotalAfterTax, 51300],
        ['rupiah decimals beside a tax-included row', CORD_RECEIPTS.rupiahDecimals, 165000],
        ['the total after rounding rows', CORD_RECEIPTS.roundingRows, 334000],
        ['comma-decimal thousands', CORD_RECEIPTS.europeanDecimals, 9500],
        ['a dotted rupiah prefix', CORD_RECEIPTS.rupiahPrefix, 118000]
    ])('reads CORD receipt with %s', (_name, lines, expectedTotal) => {
        expect(parseReceipt(lines, CurrencyEnum.IDR)).toMatchObject({
            total: convertToMicroUnits(expectedTotal),
            currency: CurrencyEnum.IDR
        });
    });

    it.each([
        ['an ungrouped integer total', CORD_RECEIPTS.ungroupedInteger, CurrencyEnum.IDR],
        ['a quantity total row', CORD_RECEIPTS.quantityTotalRow, CurrencyEnum.IDR],
        ['grouped integers in a currency with minor units', CORD_RECEIPTS.commaThousandsWithChange, CurrencyEnum.EUR],
        ['grouped integers in a three-decimal currency', CORD_RECEIPTS.grandTotalAfterTax, CurrencyEnum.KWD]
    ])('rejects CORD receipt with %s', (_name, lines, defaultCurrency) => {
        expect(parseReceipt(lines, defaultCurrency)).toBeNull();
    });
});
