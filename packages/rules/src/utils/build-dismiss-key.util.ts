import { isDefined } from '@rnw-community/shared';

import { selectSuggestConditions } from './select-suggest-condition.util';

export const buildDismissKey = (transactionId: number, title: string, comment: string, mccCode: string | null): string => {
    const conditions = selectSuggestConditions(title, mccCode, comment);
    const conditionSignature = isDefined(conditions)
        ? conditions.map(condition => `${condition.field}:${condition.value}`).join('|')
        : 'none';

    return `${transactionId}:${conditionSignature}`;
};
