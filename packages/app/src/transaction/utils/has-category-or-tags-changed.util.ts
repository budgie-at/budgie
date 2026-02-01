interface CategoryTagsState {
    readonly categoryId: number | null;
    readonly tagIds: number[];
}

const arraysEqual = (arrayA: number[], arrayB: number[]): boolean => {
    if (arrayA.length !== arrayB.length) {
        return false;
    }

    const sortedA = [...arrayA].sort();
    const sortedB = [...arrayB].sort();

    return sortedA.every((value, index) => value === sortedB[index]);
};

export const hasCategoryOrTagsChanged = (original: CategoryTagsState, current: CategoryTagsState): boolean => {
    const categoryChanged = original.categoryId !== current.categoryId;
    const tagsChanged = !arraysEqual(original.tagIds, current.tagIds);

    return categoryChanged || tagsChanged;
};
