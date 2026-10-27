import type { ReceiptTextLineInterface } from '../../../src/receipt/interface/receipt-text-line.interface';

export const receiptLine = (text: string, x: number, y: number, height = 0.012): ReceiptTextLineInterface => ({ text, x, y, height });
