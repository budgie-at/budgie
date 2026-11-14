import * as Atom from 'effect/reactivity/Atom';

export const enableBankingSetupPathAtom = Atom.keepAlive(Atom.make<string | null>(null));
