import { isDefined } from '@rnw-community/shared';

export const reorderTagIdsByPrimary = (tagIds: number[], primaryTagId: number | null): number[] => {
    if (!isDefined(primaryTagId) || !tagIds.includes(primaryTagId)) {
        return tagIds;
    }

    return [primaryTagId, ...tagIds.filter(tagId => tagId !== primaryTagId)];
};
