import { receiptLine } from './receipt-line';

import type { ReceiptTextLineInterface } from '../../../src/receipt/interface/receipt-text-line.interface';

export const E2E_SHARED_RECEIPT: readonly ReceiptTextLineInterface[] = [
    receiptLine('IHR LABOR', 0.084, 0.0475, 0.014),
    receiptLine('Ihr Labor GmbH', 0.084, 0.0641, 0.014),
    receiptLine('UID: ATU12345678', 0.084, 0.0808, 0.014),
    receiptLine('Rechnungsnr.: 2026-0042', 0.084, 0.0974, 0.014),
    receiptLine('Blutbild 62.10', 0.084, 0.114, 0.014),
    receiptLine('Total USD 62.10', 0.084, 0.1306, 0.014),
    receiptLine('Visa 62.10', 0.084, 0.1473, 0.014)
];
