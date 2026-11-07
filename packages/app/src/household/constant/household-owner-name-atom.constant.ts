import * as Atom from 'effect/reactivity/Atom';

export const householdOwnerNameAtom = Atom.keepAlive(Atom.make<string | null>(null));
