import { isDefined } from '@rnw-community/shared';

import { compileRule } from './compile-rule.util';
import { prepareRuleEvaluationSnapshot } from './prepare-rule-evaluation-snapshot.util';

import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleEvaluationSnapshotInterface } from '../interface/rule-evaluation-snapshot.interface';
import type { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import type { RuleWithRelationsEntityInterface } from '@budgie/contracts';

export const doesRuleMatchTransaction = (
    rule: RuleWithRelationsEntityInterface,
    transactionInput: RuleEvaluationInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => {
    const baseSnapshot = prepareRuleEvaluationSnapshot(transactionInput);
    const rawTitle = suggestRuleData.title;
    const rawComment = suggestRuleData.comment;
    const rawMccCode = suggestRuleData.mccCode ?? baseSnapshot.rawMccCode;
    const snapshot: RuleEvaluationSnapshotInterface = {
        ...baseSnapshot,
        rawTitle,
        lowerTitle: rawTitle.toLowerCase(),
        rawComment,
        lowerComment: rawComment.toLowerCase(),
        rawMccCode,
        lowerMccCode: isDefined(rawMccCode) ? rawMccCode.toLowerCase() : null
    };

    return compileRule(rule)(snapshot);
};
