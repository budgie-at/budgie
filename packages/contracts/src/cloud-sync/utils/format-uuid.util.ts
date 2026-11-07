import { bytesToHex } from '@noble/hashes/utils.js';

export const formatUuid = (bytes: Uint8Array): string => {
    const hex = bytesToHex(bytes);

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};
