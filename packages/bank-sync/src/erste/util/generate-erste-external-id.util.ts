import { ERSTE_EXTERNAL_ID_LENGTH } from '../constant/erste.constant';

import type { ErsteRowInterface } from '../interface/erste-row.interface';

/* jscpd:ignore-start */
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/* eslint-disable no-bitwise, no-plusplus, max-statements -- FNV-1a hash requires bitwise operations */
const fnv1aHash = (input: string): string => {
    let hash1 = FNV_OFFSET_BASIS;
    let hash2 = FNV_OFFSET_BASIS;
    let hash3 = FNV_OFFSET_BASIS;
    let hash4 = FNV_OFFSET_BASIS;

    for (let index = 0; index < input.length; index++) {
        const charCode = input.charCodeAt(index);

        hash1 ^= charCode;
        hash1 = Math.imul(hash1, FNV_PRIME);

        hash2 ^= charCode ^ (index & 0xff);
        hash2 = Math.imul(hash2, FNV_PRIME);

        hash3 ^= (charCode + index) & 0xff;
        hash3 = Math.imul(hash3, FNV_PRIME);

        hash4 ^= charCode ^ ((index * 31) & 0xff);
        hash4 = Math.imul(hash4, FNV_PRIME);
    }

    const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
    const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
    const part3 = (hash3 >>> 0).toString(16).padStart(8, '0');
    const part4 = (hash4 >>> 0).toString(16).padStart(8, '0');

    return `${part1}${part2}${part3}${part4}`;
};
/* eslint-enable no-bitwise, no-plusplus, max-statements */
/* jscpd:ignore-end */

export const generateErsteExternalId = (row: ErsteRowInterface, iban: string): string =>
    fnv1aHash(`${row.date.toISOString()}|${iban}|${row.amount}|${row.reference}`).slice(0, ERSTE_EXTERNAL_ID_LENGTH);
