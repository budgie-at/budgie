import { RuleConditionFieldEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { ruleEngineService } from '../service/rule-engine.service';
import { ruleService } from '../service/rule.service';
import { buildRuleInputFromPrefill } from '../util/build-rule-input-from-prefill.util';

interface UseQuickRuleCreationParams {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onRuleCreated: () => void;
}

interface UseQuickRuleCreationReturn {
    readonly handleQuickCreate: () => void;
    readonly isCreating: boolean;
    readonly isSuccess: boolean;
}

export const useQuickRuleCreation = ({ suggestRuleData, onRuleCreated }: UseQuickRuleCreationParams): UseQuickRuleCreationReturn => {
    const { t } = useLingui();
    const [isCreating, setIsCreating] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const createRule = async (): Promise<void> => {
        setIsCreating(true);
        try {
            const conditions = [{ field: RuleConditionFieldEnum.TITLE, value: suggestRuleData.title }];

            if (isNotEmptyString(suggestRuleData.mccCode)) {
                conditions.push({ field: RuleConditionFieldEnum.MCC_CODE, value: suggestRuleData.mccCode });
            }

            const input = buildRuleInputFromPrefill({
                conditions,
                categoryId: suggestRuleData.categoryId,
                tagIds: suggestRuleData.tagIds,
                applyToExisting: true
            });

            const rule = await ruleService.create(input);
            await ruleEngineService.applyRuleToMatchingTransactions(rule.id);

            setIsSuccess(true);
            onRuleCreated();
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Could not create rule`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleQuickCreate = () => {
        if (isCreating || isSuccess) {
            return;
        }

        void createRule();
    };

    return { handleQuickCreate, isCreating, isSuccess };
};
