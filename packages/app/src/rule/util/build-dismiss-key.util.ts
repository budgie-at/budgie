import { isDefined } from '@rnw-community/shared';

import { selectSuggestCondition } from './select-suggest-condition.util';

export const buildDismissKey = (transactionId: number, title: string, comment: string, mccCode: string | null): string => {
    const condition = selectSuggestCondition(title, mccCode, comment);
    const conditionSignature = isDefined(condition) ? `${condition.field}:${condition.value}` : 'none';

    return `${transactionId}:${conditionSignature}`;
};
