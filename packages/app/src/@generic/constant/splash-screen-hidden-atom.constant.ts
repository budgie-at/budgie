import * as Atom from 'effect/reactivity/Atom';

export const splashScreenHiddenAtom = Atom.keepAlive(Atom.make(false));
