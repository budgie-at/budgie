import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

export const getPatternTagIds = (patterns: RepeatedTransactionPatternInterface[], categoryId: number): number[] => {
    const tagIdSet = new Set<number>();

    for (const pattern of patterns) {
        if (pattern.categoryId === categoryId) {
            for (const tagId of pattern.tagIds) {
                tagIdSet.add(tagId);
            }
        }
    }

    return [...tagIdSet];
};
