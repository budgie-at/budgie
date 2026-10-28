import { receiptLine } from './receipt-line';

import type { ReceiptTextLineInterface } from '../../../src/receipt/interface/receipt-text-line.interface';

export const USD_TIP_RECEIPT: readonly ReceiptTextLineInterface[] = [
    receiptLine('THE GOLDEN SPOON', 0.22, 0.03, 0.034),
    receiptLine('Bistro & Bar', 0.36, 0.072),
    receiptLine('125 Market Street', 0.3, 0.09),
    receiptLine('San Francisco, CA 94105', 0.26, 0.108),
    receiptLine('Server: Maria', 0.06, 0.14),
    receiptLine('Table 12', 0.7, 0.14),
    receiptLine('Check #: 1047', 0.06, 0.158),
    receiptLine('10/27/2026 8:14 PM', 0.06, 0.176),
    receiptLine('Burger', 0.06, 0.21),
    receiptLine('18.50', 0.8, 0.21),
    receiptLine('Caesar Salad', 0.06, 0.228),
    receiptLine('14.00', 0.8, 0.228),
    receiptLine('Craft Beer 2 @ 8.00', 0.06, 0.246),
    receiptLine('16.00', 0.8, 0.246),
    receiptLine('Subtotal', 0.06, 0.276),
    receiptLine('48.50', 0.8, 0.276),
    receiptLine('Tax 8.625%', 0.06, 0.294),
    receiptLine('4.18', 0.8, 0.294),
    receiptLine('Total', 0.06, 0.312),
    receiptLine('52.68', 0.8, 0.312),
    receiptLine('Tip', 0.06, 0.342),
    receiptLine('10.00', 0.8, 0.342),
    receiptLine('Total', 0.06, 0.36, 0.016),
    receiptLine('$62.68', 0.78, 0.36, 0.016),
    receiptLine('VISA **** 7730', 0.06, 0.396),
    receiptLine('Approved', 0.06, 0.414),
    receiptLine('Thank you for dining with us!', 0.18, 0.444)
];
