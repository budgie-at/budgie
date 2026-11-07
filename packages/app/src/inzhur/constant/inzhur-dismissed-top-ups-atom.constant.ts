import * as Atom from 'effect/reactivity/Atom';

export const inzhurDismissedTopUpsAtom = Atom.keepAlive(Atom.make<readonly string[]>([]));
