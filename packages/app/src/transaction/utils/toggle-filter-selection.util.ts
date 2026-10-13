import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

export const toggleFilterSelection = <T>(prev: T[] | null, selected: T[]): T[] | null => {
    if (!isDefined(prev)) {
        return selected;
    }

    const allSelected = selected.every(item => prev.includes(item));

    if (allSelected) {
        const next = prev.filter(item => !selected.includes(item));

        return isNotEmptyArray(next) ? next : null;
    }

    return [...new Set([...prev, ...selected])];
};
