import * as Atom from 'effect/reactivity/Atom';

import type { CloudRestoreFailureEnum } from '../enum/cloud-restore-failure.enum';

export const cloudRestoreFailureAtom = Atom.keepAlive(Atom.make<Readonly<Record<string, CloudRestoreFailureEnum | null>>>({}));
