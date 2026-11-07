import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isString } from '@rnw-community/shared';

import { SYNC_JSON_UNKNOWN_SCHEMA } from '../constant/sync-json-unknown-schema.constant';
import { SYNC_MOVED_TO_FIELD } from '../constant/sync-moved-fields.constant';

import { readMovedField } from './read-moved-field.util';

export const readStoredMovedTo = (payload: string | null): string | null =>
    isString(payload)
        ? readMovedField(Option.getOrNull(Schema.decodeOption(SYNC_JSON_UNKNOWN_SCHEMA)(payload)), SYNC_MOVED_TO_FIELD)
        : null;
