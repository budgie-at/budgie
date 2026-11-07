import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { SYNC_JSON_UNKNOWN_SCHEMA } from '../constant/sync-json-unknown-schema.constant';

import { toSyncApplyItem } from './to-sync-apply-item.util';

export const toStoredSyncApplyItem = Effect.fnUntraced(function* (payload: string, systemFields: string | null) {
    const raw = yield* Schema.decodeEffect(SYNC_JSON_UNKNOWN_SCHEMA)(payload);

    return yield* toSyncApplyItem(raw, systemFields);
});
