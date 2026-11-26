import { isDefined } from '@rnw-community/shared';

import { resolveRuleMccCode } from './resolve-rule-mcc-code.util';

import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleEvaluationSnapshotInterface } from '../interface/rule-evaluation-snapshot.interface';

export const prepareRuleEvaluationSnapshot = (input: RuleEvaluationInputInterface): RuleEvaluationSnapshotInterface => {
    const rawExternalSource = input.externalSource ?? null;
    const rawMccCode = resolveRuleMccCode(input.entries);

    return {
        type: input.type,
        lowerType: input.type.toLowerCase(),
        rawTitle: input.title,
        lowerTitle: input.title.toLowerCase(),
        rawComment: input.comment,
        lowerComment: input.comment.toLowerCase(),
        amount: input.amount,
        accountId: input.fromAccountId ?? input.toAccountId,
        rawExternalSource,
        lowerExternalSource: isDefined(rawExternalSource) ? rawExternalSource.toLowerCase() : null,
        rawMccCode,
        lowerMccCode: isDefined(rawMccCode) ? rawMccCode.toLowerCase() : null
    };
};
