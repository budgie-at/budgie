import * as Atom from 'effect/reactivity/Atom';

import type { PendingReceiptInterface } from '../interface/pending-receipt.interface';

export const pendingReceiptAtom = Atom.keepAlive(Atom.make<PendingReceiptInterface | null>(null));
