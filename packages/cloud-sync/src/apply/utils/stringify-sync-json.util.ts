import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { SYNC_JSON_UNKNOWN_SCHEMA } from '../constant/sync-json-unknown-schema.constant';

export const stringifySyncJson = (value: unknown) => Schema.encodeEffect(SYNC_JSON_UNKNOWN_SCHEMA)(value).pipe(Effect.orDie);
