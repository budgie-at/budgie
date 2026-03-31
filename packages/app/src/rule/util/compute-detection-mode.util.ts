import { ComputeDetectionModeParamsInterface } from '../interface/compute-detection-mode-params.interface';
import { RuleDetectionModeType } from '../type/rule-detection-mode.type';

export const computeDetectionMode = (params: ComputeDetectionModeParamsInterface): RuleDetectionModeType => {
    const { isBankSynced, hasChanges, ruleCreated, matchingRulesCount } = params;

    if (isBankSynced && hasChanges && !ruleCreated && matchingRulesCount === 0) {
        return 'suggest';
    }

    if (isBankSynced && matchingRulesCount > 0) {
        return 'match';
    }

    return 'none';
};
