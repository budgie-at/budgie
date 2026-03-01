import { RuleConditionMatchTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SUGGEST_RULE_CONDITION_FIELDS, SuggestRuleConditionField } from '../constant/suggest-rule-condition-fields.constant';
import { useMatchingTransactionCount } from '../hooks/use-matching-transaction-count.hook';
import { RuleCreationProgressInterface } from '../interface/rule-creation-progress.interface';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { ruleEngineService } from '../service/rule-engine.service';
import { ruleService } from '../service/rule.service';
import { buildRuleInputFromPrefill } from '../util/build-rule-input-from-prefill.util';
import { buildSuggestRuleConditions } from '../util/build-suggest-rule-conditions.util';
import { getSuggestRuleFieldValue } from '../util/get-suggest-rule-field-value.util';

interface UseCreateSuggestRuleParams {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onCreateRule: () => void;
}

export const useCreateSuggestRule = ({ suggestRuleData, onCreateRule }: UseCreateSuggestRuleParams) => {
    const [applyToExisting, setApplyToExisting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [progress, setProgress] = useState<RuleCreationProgressInterface | null>(null);

    const availableFields = SUGGEST_RULE_CONDITION_FIELDS.filter(field =>
        isNotEmptyString(getSuggestRuleFieldValue(field, suggestRuleData))
    );

    const conditions = buildSuggestRuleConditions(suggestRuleData);

    const { count: matchingCount, isLoading: isCountLoading } = useMatchingTransactionCount({
        conditions,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        enabled: isNotEmptyArray(availableFields)
    });

    const handleCreateRule = async () => {
        setIsCreating(true);
        try {
            const prefillData = {
                conditions: availableFields.flatMap(field => {
                    const value = getSuggestRuleFieldValue(field, suggestRuleData);

                    return isDefined(value) ? { field, value } : [];
                }),
                categoryId: suggestRuleData.categoryId,
                tagIds: suggestRuleData.tagIds,
                applyToExisting
            };

            const input = buildRuleInputFromPrefill(prefillData);
            const rule = await ruleService.create(input);

            if (applyToExisting) {
                setIsApplying(true);
                const handleProgress = (processed: number, total: number) => {
                    setProgress({ processed, total });
                };
                await ruleEngineService.applyRuleToMatchingTransactions(rule.id, handleProgress);
                setIsApplying(false);
            }

            onCreateRule();
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Could not create rule`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsCreating(false);
            setIsApplying(false);
            setProgress(null);
        }
    };

    const isBusy = isCreating || isApplying;
    const selectedFields = new Set<SuggestRuleConditionField>(availableFields);
    const handleCreate = () => void handleCreateRule();

    return {
        applyToExisting,
        setApplyToExisting,
        isBusy,
        progress,
        matchingCount,
        isCountLoading,
        selectedFields,
        handleCreate
    };
};
