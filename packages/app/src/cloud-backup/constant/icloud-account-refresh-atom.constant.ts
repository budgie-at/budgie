import * as Atom from 'effect/reactivity/Atom';

export const iCloudAccountRefreshAtom = Atom.keepAlive(Atom.make(0));
