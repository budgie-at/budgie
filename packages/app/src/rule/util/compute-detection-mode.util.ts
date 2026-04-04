import { ComputeDetectionModeParamsInterface } from '../interface/compute-detection-mode-params.interface';
import { RuleDetectionModeType } from '../type/rule-detection-mode.type';

export const computeDetectionMode = (params: ComputeDetectionModeParamsInterface): RuleDetectionModeType => {
    const { hasChanges, ruleCreated, isDismissed, matchingRulesCount } = params;

    if (matchingRulesCount > 0) {
        return 'match';
    }

    if (hasChanges && !ruleCreated && !isDismissed && matchingRulesCount === 0) {
        return 'suggest';
    }

    return 'none';
};
