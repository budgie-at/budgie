import * as Atom from 'effect/reactivity/Atom';

export const householdAccountShareDraftAtom = Atom.family((accountId: number) => Atom.make<boolean | null>(null));
