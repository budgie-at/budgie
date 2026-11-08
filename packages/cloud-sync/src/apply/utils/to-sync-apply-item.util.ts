import * as Effect from 'effect/Effect';

import { decodeSyncRecord } from '../../mapping/utils/decode-sync-record.util';
import { SYNC_MOVED_FROM_FIELD, SYNC_MOVED_TO_FIELD } from '../constant/sync-moved-fields.constant';

import { readMovedField } from './read-moved-field.util';
import { stringifySyncJson } from './stringify-sync-json.util';

import type { SyncApplyItemInterface } from '../interface/sync-apply-item.interface';

export const toSyncApplyItem = Effect.fnUntraced(function* (raw: unknown, systemFields: string | null) {
    const decoded = yield* decodeSyncRecord(raw);
    const envelopeJson = yield* stringifySyncJson(raw);

    return {
        decoded,
        envelopeJson,
        systemFields,
        movedTo: readMovedField(raw, SYNC_MOVED_TO_FIELD),
        movedFrom: readMovedField(raw, SYNC_MOVED_FROM_FIELD)
    } satisfies SyncApplyItemInterface;
});
