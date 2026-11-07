import * as Atom from 'effect/reactivity/Atom';

import type { InzhurValuePointInterface } from '@budgie/sync';

export const inzhurChartScrubAtom = Atom.make<InzhurValuePointInterface | null>(null);
