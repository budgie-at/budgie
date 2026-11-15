import * as Atom from 'effect/reactivity/Atom';

export const yieldChartAnimatedAtom = Atom.keepAlive(Atom.make(false));
