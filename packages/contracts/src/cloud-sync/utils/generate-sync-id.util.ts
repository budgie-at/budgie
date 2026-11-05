import { formatUuid } from './format-uuid.util';

const UUID_BYTE_LENGTH = 16;
const TIMESTAMP_BYTE_LENGTH = 6;
const BYTE_RANGE = 256;

export const generateSyncId = (): string => {
    const bytes = Uint8Array.from({ length: UUID_BYTE_LENGTH }, () => Math.floor(Math.random() * BYTE_RANGE));
    const timestamp = Date.now();

    for (let index = 0; index < TIMESTAMP_BYTE_LENGTH; index++) {
        bytes[TIMESTAMP_BYTE_LENGTH - 1 - index] = Math.floor(timestamp / BYTE_RANGE ** index) % BYTE_RANGE;
    }

    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return formatUuid(bytes);
};
