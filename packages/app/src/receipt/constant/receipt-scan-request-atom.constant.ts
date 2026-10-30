import * as Atom from 'effect/reactivity/Atom';

import type { ReceiptSourceEnum } from '../enum/receipt-source.enum';

export const receiptScanRequestAtom = Atom.keepAlive(Atom.make<ReceiptSourceEnum | null>(null));
