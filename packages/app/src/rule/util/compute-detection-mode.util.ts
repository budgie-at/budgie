import { isPositiveNumber } from '@rnw-community/shared';

import { RuleDetectionModeEnum } from '../enum/rule-detection-mode.enum';
import { ComputeDetectionModeParamsInterface } from '../interface/compute-detection-mode-params.interface';

export const computeDetectionMode = (params: ComputeDetectionModeParamsInterface): RuleDetectionModeEnum => {
    const { hasChanges, ruleCreated, isDismissed, matchingRulesCount, hasConflictWithMatchingRules } = params;
    const canSuggest = hasChanges && !ruleCreated && !isDismissed;

    if (matchingRulesCount === 1 && canSuggest) {
        return RuleDetectionModeEnum.UPDATE;
    }

    if (isPositiveNumber(matchingRulesCount) && !hasConflictWithMatchingRules) {
        return RuleDetectionModeEnum.MATCH;
    }

    if (canSuggest) {
        return RuleDetectionModeEnum.SUGGEST;
    }

    if (isPositiveNumber(matchingRulesCount)) {
        return RuleDetectionModeEnum.MATCH;
    }

    return RuleDetectionModeEnum.NONE;
};
