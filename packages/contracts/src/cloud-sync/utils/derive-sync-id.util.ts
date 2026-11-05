import { sha1 } from '@noble/hashes/legacy.js';
import { concatBytes, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

import { formatUuid } from './format-uuid.util';

const UUID_BYTE_LENGTH = 16;

export const deriveSyncId = (namespace: string, name: string): string => {
    const digest = sha1(concatBytes(hexToBytes(namespace.replaceAll('-', '')), utf8ToBytes(name))).slice(0, UUID_BYTE_LENGTH);

    digest[6] = (digest[6] & 0x0f) | 0x50;
    digest[8] = (digest[8] & 0x3f) | 0x80;

    return formatUuid(digest);
};
