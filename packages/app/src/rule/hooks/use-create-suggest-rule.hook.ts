import { RuleConditionMatchTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { SUGGEST_RULE_CONDITION_FIELDS, SuggestRuleConditionField } from '../constant/suggest-rule-condition-fields.constant';
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
    const [isBusy, setIsBusy] = useState(false);

    const availableFields = SUGGEST_RULE_CONDITION_FIELDS.filter(field =>
        isNotEmptyString(getSuggestRuleFieldValue(field, suggestRuleData))
    );

    const handleCreateRule = async () => {
        setIsBusy(true);
        try {
            const conditions = buildSuggestRuleConditions(suggestRuleData);
            const count = await ruleEngineService.countMatchingTransactions({
                conditions,
                conditionMatchType: RuleConditionMatchTypeEnum.ALL
            });

            let shouldApply = false;
            if (count > 0) {
                shouldApply = await confirmAlert({
                    title: t`Apply to existing transactions?`,
                    message: t`${count} existing transactions match this rule.`,
                    confirmText: t`Apply`,
                    cancelText: t`Skip`
                });
            }

            const prefillData = {
                conditions: availableFields.flatMap(field => {
                    const value = getSuggestRuleFieldValue(field, suggestRuleData);

                    return isDefined(value) ? { field, value } : [];
                }),
                categoryId: suggestRuleData.categoryId,
                tagIds: suggestRuleData.tagIds,
                applyToExisting: false
            };

            const input = buildRuleInputFromPrefill(prefillData);
            const rule = await ruleService.create(input);

            if (shouldApply) {
                await ruleEngineService.applyRuleToMatchingTransactions(rule.id);
            }

            onCreateRule();
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Could not create rule`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsBusy(false);
        }
    };

    const selectedFields = new Set<SuggestRuleConditionField>(availableFields);
    const handleCreate = () => void handleCreateRule();

    return {
        isBusy,
        selectedFields,
        handleCreate
    };
};
