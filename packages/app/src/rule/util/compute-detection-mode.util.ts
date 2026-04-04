import { ComputeDetectionModeParamsInterface } from '../interface/compute-detection-mode-params.interface';
import { RuleDetectionModeType } from '../type/rule-detection-mode.type';

export const computeDetectionMode = (params: ComputeDetectionModeParamsInterface): RuleDetectionModeType => {
    const { hasChanges, ruleCreated, isDismissed, matchingRulesCount, hasConflictWithMatchingRules } = params;
    const shouldSuggestOverride = hasConflictWithMatchingRules && matchingRulesCount > 0;

    if (matchingRulesCount > 0 && !shouldSuggestOverride) {
        return 'match';
    }

    if (hasChanges && !ruleCreated && !isDismissed && (matchingRulesCount === 0 || shouldSuggestOverride)) {
        return 'suggest';
    }

    if (matchingRulesCount > 0) {
        return 'match';
    }

    return 'none';
};
