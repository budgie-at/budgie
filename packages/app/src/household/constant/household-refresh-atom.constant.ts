import * as Atom from 'effect/reactivity/Atom';

export const householdRefreshAtom = Atom.keepAlive(Atom.make(0));
