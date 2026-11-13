import { YieldRangeEnum } from '@budgie/market';
import * as Atom from 'effect/reactivity/Atom';

export const yieldRangeAtom = Atom.keepAlive(Atom.make(YieldRangeEnum.YEAR));
