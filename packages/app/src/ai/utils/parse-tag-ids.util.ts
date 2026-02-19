import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

export const parseTagIds = (tagIdsString: string | null): number[] => {
    if (!isNotEmptyString(tagIdsString)) {
        return [];
    }

    return tagIdsString.split(',').map(Number).filter(isPositiveNumber);
};
