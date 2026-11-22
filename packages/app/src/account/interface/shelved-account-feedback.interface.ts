import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Cause from 'effect/Cause';
import type * as Effect from 'effect/Effect';

export interface ShelvedAccountFeedbackInterface<A> {
    readonly action: Effect.Effect<A, Cause.YieldableError, AppServices>;
    readonly successText: string;
    readonly errorText: string;
    readonly undo: ((result: A) => Effect.Effect<unknown, Cause.YieldableError, AppServices>) | null;
}
