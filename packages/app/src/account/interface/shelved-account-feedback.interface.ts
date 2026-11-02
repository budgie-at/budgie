import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Effect from 'effect/Effect';

export interface ShelvedAccountFeedbackInterface {
    readonly action: Effect.Effect<unknown, unknown, AppServices>;
    readonly successText: string;
    readonly errorText: string;
    readonly undo: Effect.Effect<unknown, unknown, AppServices> | null;
}
