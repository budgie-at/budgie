import { SnapshotWithStatusInterface } from './snapshot-with-status.interface';

import type * as Effect from 'effect/Effect';
import type * as Atom from 'effect/reactivity/Atom';

export interface AiSubsystemServiceInterface {
    readonly snapshot: Atom.Atom<SnapshotWithStatusInterface>;
    readonly start: () => Effect.Effect<void>;
    readonly stop: () => Effect.Effect<void>;
}
