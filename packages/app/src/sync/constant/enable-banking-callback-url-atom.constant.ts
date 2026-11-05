import * as Atom from 'effect/reactivity/Atom';

export const enableBankingCallbackUrlAtom = Atom.keepAlive(Atom.make<string | null>(null));
