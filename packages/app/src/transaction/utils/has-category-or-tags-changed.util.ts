import { isDefined } from '@rnw-community/shared';

interface OriginalValues {
    readonly categoryId: number | null;
    readonly tagIds: number[];
}

interface UpdatedValues {
    readonly categoryId: number | null;
    readonly tagIds: number[];
}

export const hasCategoryOrTagsChanged = (original: OriginalValues, updated: UpdatedValues): boolean => {
    const categoryChanged = original.categoryId !== updated.categoryId;

    const originalTagsSet = new Set(original.tagIds.filter(isDefined));
    const updatedTagsSet = new Set(updated.tagIds.filter(isDefined));

    const tagsChanged = originalTagsSet.size !== updatedTagsSet.size || [...originalTagsSet].some(tagId => !updatedTagsSet.has(tagId));

    return categoryChanged || tagsChanged;
};
