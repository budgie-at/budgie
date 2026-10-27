import { receiptLine } from './receipt-line';

import type { ReceiptTextLineInterface } from '../../../src/receipt/interface/receipt-text-line.interface';

export const BILLA_RECEIPT: readonly ReceiptTextLineInterface[] = [
    receiptLine('BILLA', 0.35, 0.03, 0.05),
    receiptLine('BILLA AG', 0.38, 0.09),
    receiptLine('Wiener Straße 12, 1020 Wien', 0.25, 0.108),
    receiptLine('UID: ATU 12345678', 0.3, 0.126),
    receiptLine('Filiale 1234', 0.36, 0.144),
    receiptLine('EUR', 0.8, 0.18),
    receiptLine('Clever Milch', 0.06, 0.2),
    receiptLine('1,19 A', 0.8, 0.2),
    receiptLine('Ja! Natürlich Bananen', 0.06, 0.218),
    receiptLine('2,49 A', 0.8, 0.218),
    receiptLine('Kaffee Bohnen 1kg', 0.06, 0.236),
    receiptLine('12,99 B', 0.8, 0.236),
    receiptLine('Semmel', 0.06, 0.254),
    receiptLine('2 x 0,89', 0.4, 0.254),
    receiptLine('1,78 A', 0.8, 0.254),
    receiptLine('Zwischensumme', 0.06, 0.28),
    receiptLine('18,45', 0.8, 0.28),
    receiptLine('SUMME EUR', 0.06, 0.304, 0.018),
    receiptLine('18,45', 0.78, 0.304, 0.018),
    receiptLine('Bankomat', 0.06, 0.334),
    receiptLine('18,45', 0.8, 0.334),
    receiptLine('Kartennr: ************3318', 0.06, 0.352),
    receiptLine('MwSt-Satz Netto MwSt Brutto', 0.06, 0.38),
    receiptLine('A 10% 4,96 0,50 5,46', 0.06, 0.398),
    receiptLine('B 20% 10,83 2,16 12,99', 0.06, 0.416),
    receiptLine('27.10.2026 18:03', 0.06, 0.446),
    receiptLine('Kassa: 3', 0.45, 0.446),
    receiptLine('Bon-Nr: 4711', 0.7, 0.446),
    receiptLine('Vielen Dank für Ihren Einkauf!', 0.2, 0.476)
];
