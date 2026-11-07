import * as Random from 'effect/Random';

import { formatUuid } from './format-uuid.util';

const UUID_BYTE_LENGTH = 16;
const TIMESTAMP_BYTE_LENGTH = 6;
const BYTE_RANGE = 256;
const VERSION_BYTE_INDEX = 6;
const VARIANT_BYTE_INDEX = 8;
const VERSION_NIBBLE_RANGE = 16;
const VARIANT_RANGE = 64;
const VERSION_7_BASE = 0x70;
const VARIANT_BASE = 0x80;

export const generateSyncId = (): string => {
    const random = Random.Random.defaultValue();
    const timestamp = Date.now();
    const bytes = Uint8Array.from({ length: UUID_BYTE_LENGTH }, (_, index) => {
        const value = Math.floor(random.nextDoubleUnsafe() * BYTE_RANGE);

        if (index < TIMESTAMP_BYTE_LENGTH) {
            return Math.floor(timestamp / BYTE_RANGE ** (TIMESTAMP_BYTE_LENGTH - 1 - index)) % BYTE_RANGE;
        }

        if (index === VERSION_BYTE_INDEX) {
            return (value % VERSION_NIBBLE_RANGE) + VERSION_7_BASE;
        }

        return index === VARIANT_BYTE_INDEX ? (value % VARIANT_RANGE) + VARIANT_BASE : value;
    });

    return formatUuid(bytes);
};
