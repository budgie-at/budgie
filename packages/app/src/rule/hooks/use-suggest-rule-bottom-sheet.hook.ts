import { RuleConditionFieldEnum } from '@budgie/contracts';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useRuleFormModal } from '../context/rule-form-modal.context';
import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { ruleService } from '../service/rule.service';
import { buildRuleInputFromPrefill } from '../util/build-rule-input-from-prefill.util';
import { getSuggestRuleFieldValue } from '../util/get-suggest-rule-field-value.util';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

const CONDITION_FIELDS: SuggestRuleConditionField[] = [
    RuleConditionFieldEnum.TITLE,
    RuleConditionFieldEnum.COMMENT,
    RuleConditionFieldEnum.MCC_CODE
];

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

    const availableFields = CONDITION_FIELDS.filter(field => {
        const value = getSuggestRuleFieldValue(field, suggestRuleData);

        return isNotEmptyString(value);
    });

    const toggleField = (field: SuggestRuleConditionField) => {
        setSelectedFields(previous => {
            const next = new Set(previous);
            if (next.has(field)) {
                next.delete(field);
            } else {
                next.add(field);
            }

            return next;
        });
    };

    const hasSelectedConditions = selectedFields.size > 0;

    const buildPrefillData = (): RulePrefillDataInterface => ({
        conditions: Array.from(selectedFields)
            .map(field => {
                const value = getSuggestRuleFieldValue(field, suggestRuleData);

                return isDefined(value) ? { field, value } : null;
            })
            .filter(isDefined),
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

    const handleDismiss = () => {
        onDismiss();
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
        handleDismiss
    };
};
