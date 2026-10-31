import type { AppServices } from '../runtime/app.runtime';
import type { MutationTracker } from '../type/mutation-tracker.type';
import type * as Effect from 'effect/Effect';

export interface EntityRowOperationsInterface {
    readonly deleteLabel: string;
    readonly onMerge: (trackMutation: MutationTracker) => Effect.Effect<unknown, unknown, AppServices>;
    readonly onDelete: (trackMutation: MutationTracker) => Effect.Effect<boolean, unknown, AppServices>;
}
