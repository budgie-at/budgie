import { t } from '@lingui/core/macro';
import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';
import { buildSubsystemSnapshot } from '../utils/build-subsystem-snapshot.util';

import { translationDrainerSnapshotAtom, translationProgressSnapshotAtom } from './ai-snapshot-atoms.constant';
import { aiUmbrellaStatusAtom } from './ai-umbrella-status-atom.constant';
import { EMPTY_SUBSYSTEM_SNAPSHOT } from './empty-subsystem-snapshot.constant';

export const aiTranslationStatusAtom = Atom.make(get =>
    get(aiUmbrellaStatusAtom).state === AiSystemUmbrellaStateEnum.HEALTHY
        ? buildSubsystemSnapshot(get(translationDrainerSnapshotAtom), get(translationProgressSnapshotAtom), {
              boosting: t`Rebuilding translations`,
              working: t`Translating categories and tags`,
              ready: t`Translations ready`
          })
        : EMPTY_SUBSYSTEM_SNAPSHOT
).pipe(Atom.withEquality(Equal.equals));
