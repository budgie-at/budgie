import { isNotEmptyString } from '@rnw-community/shared';

const FTS5_RESERVED = /["*():]/gu;

export const toFtsQuery = (input: string): string | null => {
    const sanitized = input.replace(FTS5_RESERVED, '').trim();
    if (!isNotEmptyString(sanitized)) {
        return null;
    }

    return `${sanitized}*`;
};
