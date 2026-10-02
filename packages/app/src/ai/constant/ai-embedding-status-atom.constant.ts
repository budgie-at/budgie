import { t } from '@lingui/core/macro';
import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';
import { buildSubsystemSnapshot } from '../utils/build-subsystem-snapshot.util';

import { embeddingProgressSnapshotAtom } from './ai-snapshot-atoms.constant';
import { aiUmbrellaStatusAtom } from './ai-umbrella-status-atom.constant';
import { embeddingDrainerSnapshotAtom } from './embedding-drainer-snapshot-atom.constant';
import { EMPTY_SUBSYSTEM_SNAPSHOT } from './empty-subsystem-snapshot.constant';

export const aiEmbeddingStatusAtom = Atom.make(get =>
    get(aiUmbrellaStatusAtom).state === AiSystemUmbrellaStateEnum.HEALTHY
        ? buildSubsystemSnapshot(get(embeddingDrainerSnapshotAtom), get(embeddingProgressSnapshotAtom), {
              boosting: t`Rebuilding learning`,
              working: t`Learning transactions`,
              ready: t`Learning up to date`
          })
        : EMPTY_SUBSYSTEM_SNAPSHOT
).pipe(Atom.withEquality(Equal.equals));
