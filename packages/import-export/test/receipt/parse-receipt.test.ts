import { convertToMicroUnits, CurrencyEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { parseReceipt } from '../../src/receipt/utils/parse-receipt.util';

import { BILLA_RECEIPT } from './fixture/billa-receipt.fixture';
import { E2E_SHARED_RECEIPT } from './fixture/e2e-shared-receipt.fixture';
import { IHR_LABOR_LEGAL_NAME, IHR_LABOR_RECEIPT } from './fixture/ihr-labor-receipt.fixture';
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
                fingerprint: 'ATU12345678|2026-0042|62100000|'
            }
        ]
    ])('reads %s', (_name, lines, expected) => {
        expect(parseReceipt(lines)).toEqual(expected);
    });
});
