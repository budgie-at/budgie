import type { ReceiptTextLineInterface } from '../../../src/receipt/interface/receipt-text-line.interface';

const CHARACTER_WIDTH = 0.011;
const MAX_WIDTH = 0.9;

export const receiptLine = (text: string, x: number, y: number, height = 0.012): ReceiptTextLineInterface => ({
    text,
    x,
    y,
    width: Math.min(MAX_WIDTH, text.length * CHARACTER_WIDTH),
    height,
    confidence: 0.98
});
