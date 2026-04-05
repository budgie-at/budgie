import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

export const getPatternComments = (patterns: RepeatedTransactionPatternInterface[], categoryId: number): string[] => {
    const commentSet = new Set<string>();

    for (const pattern of patterns) {
        if (pattern.categoryId === categoryId && isNotEmptyString(pattern.comment)) {
            commentSet.add(pattern.comment);
        }
    }

    return [...commentSet];
};
