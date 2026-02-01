import { RuleConditionFieldEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useSuggestRuleModal } from '../context/suggest-rule-modal.context';
import { RulePrefillConditionInterface, RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { ruleService } from '../service/rule.service';
import { buildRuleInputFromPrefill } from '../util/build-rule-input-from-prefill.util';

const getConditionValue = (field: RuleConditionFieldEnum, ruleData: SuggestRuleDataInterface): string => {
    switch (field) {
        case RuleConditionFieldEnum.TITLE:
            return ruleData.title;
        case RuleConditionFieldEnum.COMMENT:
            return ruleData.comment ?? '';
        case RuleConditionFieldEnum.MCC_CODE:
            return ruleData.mccCode ?? '';
        default:
            return '';
    }
};

const buildPrefillData = (
    selectedFields: RuleConditionFieldEnum[],
    ruleData: SuggestRuleDataInterface,
    applyToExisting: boolean
): RulePrefillDataInterface => {
    const conditions: RulePrefillConditionInterface[] = selectedFields.map(field => ({
        field,
        value: getConditionValue(field, ruleData)
    }));

    return {
        conditions,
        categoryId: ruleData.categoryId,
        tagIds: ruleData.tagIds,
        applyToExisting
    };
};

export const useSuggestRuleModalLogic = () => {
    const { t } = useLingui();
    const { currentParams, resolveSuggestRuleModal } = useSuggestRuleModal();

    const [selectedFields, setSelectedFields] = useState<RuleConditionFieldEnum[]>([RuleConditionFieldEnum.TITLE]);
    const [applyToExisting, setApplyToExisting] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const toggleField = (field: RuleConditionFieldEnum) => {
        setSelectedFields(current => {
            const isSelected = current.includes(field);

            return isSelected ? current.filter(currentField => currentField !== field) : [...current, field];
        });
    };

    const handleCancel = () => {
        resolveSuggestRuleModal(null);
    };

    const handleCreateRule = async () => {
        if (!isDefined(currentParams)) {
            return;
        }

        setIsCreating(true);

        try {
            const ruleInput = buildRuleInputFromPrefill(buildPrefillData(selectedFields, currentParams, applyToExisting));
            await ruleService.create(ruleInput);
            resolveSuggestRuleModal({ created: true });
        } catch {
            Toast.show({ type: 'error', text1: t`Could not create rule`, text2: t`Please try again later` });
        } finally {
            setIsCreating(false);
        }
    };

    const getPrefillData = (): RulePrefillDataInterface | null => {
        if (!isDefined(currentParams)) {
            return null;
        }

        return buildPrefillData(selectedFields, currentParams, applyToExisting);
    };

    return {
        data: currentParams,
        selectedFields,
        toggleField,
        applyToExisting,
        setApplyToExisting,
        isCreating,
        handleCancel,
        handleCreateRule,
        getPrefillData,
        hasComment: isDefined(currentParams) && isNotEmptyString(currentParams.comment),
        hasMccCode: isDefined(currentParams) && isNotEmptyString(currentParams.mccCode),
        hasSelectedFields: isNotEmptyArray(selectedFields)
    };
};
