import * as Atom from 'effect/reactivity/Atom';

import type { ReceiptScanProgressInterface } from '../interface/receipt-scan-progress.interface';

export const receiptScanProgressAtom = Atom.keepAlive(Atom.make<ReceiptScanProgressInterface>({ current: 0, total: 0 }));
