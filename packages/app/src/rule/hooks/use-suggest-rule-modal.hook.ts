import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { typedObjectKeys } from '../../@generic/utils/typed-object-keys.util';
import { toggleSetItem } from '../../sync/util/toggle-set-item.util';
import { SUGGEST_RULE_CONDITION_FIELD_LABELS } from '../constant/suggest-rule-condition-field-labels.constant';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { ruleEngineService } from '../service/rule-engine.service';
import { ruleService } from '../service/rule.service';
import { buildRuleInputFromPrefill } from '../util/build-rule-input-from-prefill.util';
import { getSuggestRuleFieldValue } from '../util/get-suggest-rule-field-value.util';

import { useMatchingTransactionCount } from './use-matching-transaction-count.hook';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

interface UseSuggestRuleModalHookParams {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onCreateRule: () => void;
    readonly onDismiss: () => void;
}

interface ProgressState {
    readonly processed: number;
    readonly total: number;
}

export const useSuggestRuleModalHook = ({ suggestRuleData, onCreateRule, onDismiss }: UseSuggestRuleModalHookParams) => {
    const { t } = useLingui();
    const [selectedFields, setSelectedFields] = useState<Set<SuggestRuleConditionField>>(new Set([RuleConditionFieldEnum.TITLE]));
    const [applyToExisting, setApplyToExisting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [progress, setProgress] = useState<ProgressState | null>(null);

    const availableFields: SuggestRuleConditionField[] = typedObjectKeys(SUGGEST_RULE_CONDITION_FIELD_LABELS).filter(
        (field): field is SuggestRuleConditionField => {
            const value = getSuggestRuleFieldValue(field, suggestRuleData);

            return isNotEmptyString(value);
        }
    );

    const toggleField = (field: SuggestRuleConditionField) => {
        setSelectedFields(previous => toggleSetItem(previous, field));
    };

    const hasSelectedConditions = selectedFields.size > 0;

    const conditions = Array.from(selectedFields).flatMap(field => {
        const value = getSuggestRuleFieldValue(field, suggestRuleData);

        if (!isDefined(value)) {
            return [];
        }

        return { field, operator: RuleConditionOperatorEnum.CONTAINS, value, secondaryValue: null };
    });

    const { count: matchingCount, isLoading: isCountLoading } = useMatchingTransactionCount({
        conditions,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        enabled: hasSelectedConditions
    });

    // eslint-disable-next-line max-statements -- Rule creation with optional apply-to-existing flow
    const handleCreateRule = async () => {
        if (!hasSelectedConditions) {
            return;
        }

        setIsCreating(true);
        try {
            const prefillData = {
                conditions: Array.from(selectedFields).flatMap(field => {
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

    return {
        availableFields,
        selectedFields,
        toggleField,
        applyToExisting,
        setApplyToExisting,
        isCreating,
        isApplying,
        progress,
        isBusy,
        hasSelectedConditions,
        matchingCount,
        isCountLoading,
        handleCreateRule,
        handleDismiss: onDismiss
    };
};
