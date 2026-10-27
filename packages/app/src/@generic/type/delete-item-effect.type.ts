import type { AppServices } from '../runtime/app.runtime';
import type * as Effect from 'effect/Effect';

export type DeleteItemEffectType = (id: number) => Effect.Effect<unknown, unknown, AppServices>;
