// Adapted from CORD v2 (huggingface.co/datasets/naver-clova-ix/cord-v2, NAVER Clova AI, CC BY 4.0): word boxes merged into normalised lines
import { receiptLine } from './receipt-line';

import type { ReceiptTextLineInterface } from '../../../src/receipt/interface/receipt-text-line.interface';

export const CORD_RECEIPTS = {
    commaThousandsWithChange: [
        receiptLine('ICE BLACKCOFFE 2 82,000', 0.123, 0.434, 0.032),
        receiptLine('AVOCADO COFFEE 1 61,000', 0.12, 0.463, 0.029),
        receiptLine('CHIKEN KATSU FF 1 51,000', 0.118, 0.489, 0.025),
        receiptLine('SUB_TOTAL 194,000', 0.288, 0.594, 0.034),
        receiptLine('DISCOUNT 19,400', 0.287, 0.627, 0.034),
        receiptLine('TOTAL 174,600', 0.291, 0.66, 0.036),
        receiptLine('CASH 200,000', 0.289, 0.695, 0.034),
        receiptLine('CHANGE 25,400', 0.282, 0.731, 0.034)
    ],
    grandTotalAfterTax: [
        receiptLine('BASO KUAH 1 43.636 43.636', 0.153, 0.434, 0.023),
        receiptLine('A.MINERAL GELAS 1 3,000 3,000', 0.153, 0.466, 0.023),
        receiptLine('TOTAL 46.636', 0.153, 0.498, 0.026),
        receiptLine('DPP 46.636', 0.148, 0.53, 0.025),
        receiptLine('TAX 10.00 % 4.664', 0.153, 0.56, 0.023),
        receiptLine('GRAND TOTAL 51.300', 0.147, 0.591, 0.022),
        receiptLine('TUNAI 52.000', 0.153, 0.623, 0.022),
        receiptLine('KEMBALI 700', 0.155, 0.65, 0.022)
    ],
    rupiahDecimals: [
        receiptLine('6 Pcs Cheese Tart 165000.00', 0.275, 0.57, 0.015),
        receiptLine('Box of 6', 0.294, 0.586, 0.015),
        receiptLine('PP Carrier', 0.294, 0.603, 0.016),
        receiptLine('Subtotal: Rp 165000.00', 0.256, 0.633, 0.019),
        receiptLine('Total Tax Included: Rp 15000.00', 0.255, 0.649, 0.017),
        receiptLine('Total: Rp 165000.00', 0.253, 0.679, 0.019),
        receiptLine('Customer Paid Cash: Rp 200000.00', 0.251, 0.711, 0.016),
        receiptLine('Customer Change: Rp 35000.00', 0.251, 0.729, 0.021)
    ],
    roundingRows: [
        receiptLine('(TA) NASI GRG TERI 4 165,460', 0.226, 0.542, 0.02),
        receiptLine('MEDAN', 0.231, 0.563, 0.017),
        receiptLine('(TA) BIHUN GORENG 1 40,456', 0.229, 0.581, 0.018),
        receiptLine('SEAFOOD', 0.228, 0.6, 0.02),
        receiptLine('(TA) KWETIAW SEAFOOD 1 42,274', 0.226, 0.62, 0.02),
        receiptLine('SIRAM', 0.224, 0.641, 0.02),
        receiptLine('(TA) NASI GORENG 2 55,456', 0.225, 0.659, 0.021),
        receiptLine('303,646', 0.679, 0.685, 0.021),
        receiptLine('ITEMS: 8', 0.224, 0.689, 0.021),
        receiptLine('Pb1 10% 30,365', 0.222, 0.709, 0.023),
        receiptLine('Rounding 334,011', 0.312, 0.729, 0.026),
        receiptLine('Rounding -11', 0.219, 0.752, 0.023),
        receiptLine('Total 334,000', 0.218, 0.773, 0.022),
        receiptLine('DEBIT BCA 334,000', 0.222, 0.793, 0.021)
    ],
    europeanDecimals: [
        receiptLine('2005- CHEESE JOHN', 0.192, 0.639, 0.025),
        receiptLine('9.500,00 x1 9.500,00', 0.317, 0.659, 0.026),
        receiptLine('Total Item: 1', 0.204, 0.716, 0.025),
        receiptLine('Total. 9.500,00', 0.208, 0.767, 0.026),
        receiptLine('Cash', 0.218, 0.792, 0.019),
        receiptLine('Tendered: 9.500,00', 0.22, 0.812, 0.026)
    ],
    rupiahPrefix: [
        receiptLine('5001-Corn Flakes Cookies', 0.097, 0.498, 0.028),
        receiptLine('Rp.56.000 x1 Rp.56.000', 0.233, 0.535, 0.03),
        receiptLine('5003-Chokoreto Cookies', 0.094, 0.567, 0.028),
        receiptLine('Rp.62.000 x1 Rp.62.000', 0.227, 0.604, 0.03),
        receiptLine('6002-Plastic Bag Medium', 0.094, 0.637, 0.03),
        receiptLine('Rp.0 x1 Rp.0', 0.326, 0.674, 0.03),
        receiptLine('Total Item: 3', 0.09, 0.743, 0.028),
        receiptLine('Total, Rp.118.000', 0.087, 0.812, 0.03),
        receiptLine('Debet Card 118.000', 0.09, 0.88, 0.025)
    ],
    ungroupedInteger: [
        receiptLine('J.STB PROMO 17500', 0.136, 0.525, 0.029),
        receiptLine('Y.B.BAT 46000', 0.133, 0.567, 0.034),
        receiptLine('Y.BASO PROM 27500', 0.13, 0.606, 0.031),
        receiptLine('TOTAL 91000', 0.135, 0.645, 0.038),
        receiptLine('CASH 91000', 0.132, 0.691, 0.037)
    ],
    quantityTotalRow: [
        receiptLine('901016 -TICKET CP', 0.097, 0.596, 0.031),
        receiptLine('2 60.000 60.000', 0.208, 0.633, 0.031),
        receiptLine('TOTAL DISC $ -60.000', 0.338, 0.71, 0.035),
        receiptLine('TAX 5.455', 0.491, 0.747, 0.031),
        receiptLine('Subtotal 60.000', 0.407, 0.784, 0.034),
        receiptLine('TOTAL (Qty 2.00 60.000', 0.102, 0.821, 0.035),
        receiptLine('EDC CIMB NIAGA No: xx7730 60.000', 0.139, 0.901, 0.031)
    ]
} satisfies Record<string, readonly ReceiptTextLineInterface[]>;
