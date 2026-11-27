import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import type { LightweightRuleTransactionInterface } from '../interface/lightweight-rule-transaction.interface';
import type { RuleEvaluationSnapshotInterface } from '../interface/rule-evaluation-snapshot.interface';

export const prepareLightweightRuleSnapshot = (row: LightweightRuleTransactionInterface): RuleEvaluationSnapshotInterface => {
    const effectiveTitle = isNotEmptyString(row.title) ? row.title : row.comment;

    return {
        type: row.type,
        lowerType: row.type.toLowerCase(),
        rawTitle: effectiveTitle,
        lowerTitle: effectiveTitle.toLowerCase(),
        rawComment: row.comment,
        lowerComment: row.comment.toLowerCase(),
        amount: 0,
        accountId: row.fromAccountId ?? row.toAccountId,
        rawExternalSource: row.externalSource,
        lowerExternalSource: isDefined(row.externalSource) ? row.externalSource.toLowerCase() : null,
        rawMccCode: null,
        lowerMccCode: null
    };
};
