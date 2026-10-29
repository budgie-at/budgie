import * as Atom from 'effect/reactivity/Atom';

export const receiptScanRequestAtom = Atom.keepAlive(Atom.make(false));
