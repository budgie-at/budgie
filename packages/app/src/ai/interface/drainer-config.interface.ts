import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';

import type { DrainerSnapshotInterface } from './drainer-snapshot.interface';
import type { Db } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';
import type * as Atom from 'effect/reactivity/Atom';

export interface DrainerConfigInterface<E> {
    readonly subsystem: AiSubsystemNameEnum;
    readonly relaxedIntervalMs: number;
    readonly relaxedBatchSize: number;
    readonly boostBatchSize: number;
    readonly yieldEveryRows: number;
    readonly fetchPending: (limit: number) => Effect.Effect<Effect.Effect<void, E, Db>[], E, Db>;
    readonly countPending: Effect.Effect<number, E, Db>;
    readonly afterBatch: Effect.Effect<void, E, Db>;
    readonly snapshot: Atom.Writable<DrainerSnapshotInterface>;
}
