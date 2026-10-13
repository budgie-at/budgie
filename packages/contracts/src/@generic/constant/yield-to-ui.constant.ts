import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';

export const YIELD_TO_UI = Effect.sleep(Duration.millis(1));
