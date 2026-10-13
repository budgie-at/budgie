import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

export const getPatternTagIds = (patterns: RepeatedTransactionPatternInterface[], categoryId: number): number[] => [
    ...new Set(patterns.filter(pattern => pattern.categoryId === categoryId).flatMap(pattern => pattern.tagIds))
];
