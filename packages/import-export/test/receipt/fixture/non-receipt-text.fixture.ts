import { receiptLine } from './receipt-line';

import type { ReceiptTextLineInterface } from '../../../src/receipt/interface/receipt-text-line.interface';

export const NON_RECEIPT_TEXT: readonly ReceiptTextLineInterface[] = [
    receiptLine('Team meeting notes', 0.06, 0.04, 0.03),
    receiptLine('Agenda for 27.10.2026 at 14:30', 0.06, 0.09),
    receiptLine('Total attendees: 42', 0.06, 0.11),
    receiptLine('Release 2.10 ships next week', 0.06, 0.13),
    receiptLine('Action items: send summary to everyone', 0.06, 0.15)
];
