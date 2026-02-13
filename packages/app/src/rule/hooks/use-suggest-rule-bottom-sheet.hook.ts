import { RuleConditionFieldEnum } from '@budgie/contracts';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useRuleFormModal } from '../context/rule-form-modal.context';
import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { ruleService } from '../service/rule.service';
import { buildRuleInputFromPrefill } from '../util/build-rule-input-from-prefill.util';
import { getSuggestRuleFieldValue } from '../util/get-suggest-rule-field-value.util';
import { toggleSetItem } from '../../sync/util/toggle-set-item.util';
import { SUGGEST_RULE_CONDITION_FIELD_LABELS } from '../constant/suggest-rule-condition-field-labels.constant';
import { typedObjectKeys } from '../../@generic/utils/typed-object-keys.util';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

interface UseSuggestRuleBottomSheetParams {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onCreateRule: () => void;
    readonly onDismiss: () => void;
}

export const useSuggestRuleBottomSheet = ({ suggestRuleData, onCreateRule, onDismiss }: UseSuggestRuleBottomSheetParams) => {
    const { openRuleForm } = useRuleFormModal();
    const [selectedFields, setSelectedFields] = useState<Set<SuggestRuleConditionField>>(new Set([RuleConditionFieldEnum.TITLE]));
    const [applyToExisting, setApplyToExisting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const availableFields = typedObjectKeys(SUGGEST_RULE_CONDITION_FIELD_LABELS).filter(field => {
        const value = getSuggestRuleFieldValue(field, suggestRuleData);

        return isNotEmptyString(value);
    });

    const toggleField = (field: SuggestRuleConditionField) => {
        setSelectedFields(previous => toggleSetItem(previous, field));
    };

    const hasSelectedConditions = selectedFields.size > 0;

    const buildPrefillData = (): RulePrefillDataInterface => ({
        conditions: Array.from(selectedFields).flatMap(field => {
            const value = getSuggestRuleFieldValue(field, suggestRuleData);

            return isDefined(value) ? { field, value } : [];
        }),
        categoryId: suggestRuleData.categoryId,
        tagIds: suggestRuleData.tagIds,
        applyToExisting
    });

    const handleCreateRule = async () => {
        if (!hasSelectedConditions) {
            return;
        }

        setIsCreating(true);
        try {
            const prefillData = buildPrefillData();
            const input = buildRuleInputFromPrefill(prefillData);
            await ruleService.create(input);
            onCreateRule();
        } finally {
            setIsCreating(false);
        }
    };

    const handleConfigureRule = () => {
        const prefillData = buildPrefillData();
        onDismiss();
        void openRuleForm({ prefillData });
    };

    return {
        availableFields,
        selectedFields,
        toggleField,
        applyToExisting,
        setApplyToExisting,
        isCreating,
        hasSelectedConditions,
        handleCreateRule,
        handleConfigureRule,
        handleDismiss: onDismiss
    };
};
