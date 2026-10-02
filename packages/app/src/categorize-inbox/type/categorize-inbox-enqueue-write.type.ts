import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Effect from 'effect/Effect';

export type CategorizeInboxEnqueueWriteType = (
    write: Effect.Effect<unknown, unknown, AppServices>,
    rollback: () => void,
    failedMessage: string
) => void;
