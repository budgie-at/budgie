import { isNotEmptyString, isRecord } from '@rnw-community/shared';

export const readMovedField = (raw: unknown, field: string): string | null => {
    const fields = isRecord(raw) ? raw['encryptedFields'] : null;
    const moved = isRecord(fields) ? fields[field] : null;

    return isNotEmptyString(moved) ? moved : null;
};
