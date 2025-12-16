import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

export const toggleFilterSelection = (prev: number[] | null, selected: number[]): number[] | null => {
    if (!isDefined(prev)) {
        return selected;
    }

    const allSelected = selected.every(id => prev.includes(id));

    if (allSelected) {
        const next = prev.filter(id => !selected.includes(id));

        return isNotEmptyArray(next) ? next : null;
    }

    return Array.from(new Set([...prev, ...selected]));
};
