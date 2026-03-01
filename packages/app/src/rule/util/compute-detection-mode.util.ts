import { isDefined } from '@rnw-community/shared';

import { ComputeDetectionModeParamsInterface } from '../interface/compute-detection-mode-params.interface';
import { RuleDetectionModeType } from '../type/rule-detection-mode.type';

export const computeDetectionMode = (params: ComputeDetectionModeParamsInterface): RuleDetectionModeType => {
    const { isBankSynced, hasChanges, ruleCreated, matchingRule, appliedRule } = params;

    if (isBankSynced && hasChanges && !ruleCreated && !isDefined(matchingRule)) {
        return 'suggest';
    }

    if (isBankSynced && isDefined(matchingRule)) {
        return 'match';
    }

    if (isBankSynced && isDefined(appliedRule)) {
        return 'match';
    }

    return 'none';
};
