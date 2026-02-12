import { isNotEmptyString } from '@rnw-community/shared';

export const parseTagIds = (tagIdsString: string | null): number[] => {
    if (!isNotEmptyString(tagIdsString)) {
        return [];
    }

    return tagIdsString
        .split(',')
        .map(Number)
        .filter(id => id > 0);
};
