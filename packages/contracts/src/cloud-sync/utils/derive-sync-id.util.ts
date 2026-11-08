import { sha1 } from '@noble/hashes/legacy.js';
import { concatBytes, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

import { formatUuid } from './format-uuid.util';

const UUID_BYTE_LENGTH = 16;
const VERSION_BYTE_INDEX = 6;
const VARIANT_BYTE_INDEX = 8;
const VERSION_NIBBLE_RANGE = 16;
const VARIANT_RANGE = 64;
const VERSION_5_BASE = 0x50;
const VARIANT_BASE = 0x80;

export const deriveSyncId = (namespace: string, name: string): string => {
    const digest = sha1(concatBytes(hexToBytes(namespace.replaceAll('-', '')), utf8ToBytes(name))).slice(0, UUID_BYTE_LENGTH);

    digest[VERSION_BYTE_INDEX] = (digest[VERSION_BYTE_INDEX] % VERSION_NIBBLE_RANGE) + VERSION_5_BASE;
    digest[VARIANT_BYTE_INDEX] = (digest[VARIANT_BYTE_INDEX] % VARIANT_RANGE) + VARIANT_BASE;

    return formatUuid(digest);
};
