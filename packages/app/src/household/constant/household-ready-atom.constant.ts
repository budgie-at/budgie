import * as Atom from 'effect/reactivity/Atom';

export const householdReadyAtom = Atom.keepAlive(Atom.make(false));
