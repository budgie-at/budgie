import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Cause from 'effect/Cause';
import type * as Effect from 'effect/Effect';

export interface UseExportActionOptionsInterface {
    readonly exportAction: Effect.Effect<void, Cause.YieldableError, AppServices>;
    readonly successTitle: string;
    readonly successMessage: string;
    readonly errorTitle: string;
}
