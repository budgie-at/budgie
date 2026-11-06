import type { AppServices } from '../runtime/app.runtime';
import type { MutationTracker } from '../type/mutation-tracker.type';
import type * as Cause from 'effect/Cause';
import type * as Effect from 'effect/Effect';

export interface EntityRowOperationsInterface {
    readonly deleteLabel: string;
    readonly onMerge?: (trackMutation: MutationTracker) => Effect.Effect<unknown, Cause.YieldableError, AppServices>;
    readonly onDelete: (trackMutation: MutationTracker) => Effect.Effect<boolean, Cause.YieldableError, AppServices>;
}
