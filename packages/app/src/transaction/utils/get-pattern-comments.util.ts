import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

export const getPatternComments = (patterns: RepeatedTransactionPatternInterface[], categoryId: number): string[] => [
    ...new Set(
        patterns
            .filter(pattern => pattern.categoryId === categoryId)
            .map(pattern => pattern.comment)
            .filter(isNotEmptyString)
    )
];
