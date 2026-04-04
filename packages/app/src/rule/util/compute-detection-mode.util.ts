import { ComputeDetectionModeParamsInterface } from '../interface/compute-detection-mode-params.interface';
import { RuleDetectionModeType } from '../type/rule-detection-mode.type';

export const computeDetectionMode = (params: ComputeDetectionModeParamsInterface): RuleDetectionModeType => {
    const { hasChanges, ruleCreated, isDismissed, matchingRulesCount, hasConflictWithMatchingRules } = params;
    const canSuggest = hasChanges && !ruleCreated && !isDismissed;

    if (matchingRulesCount === 1 && canSuggest) {
        return 'update';
    }

    if (matchingRulesCount > 0 && !hasConflictWithMatchingRules) {
        return 'match';
    }

    if (canSuggest) {
        return 'suggest';
    }

    if (matchingRulesCount > 0) {
        return 'match';
    }

    return 'none';
};
