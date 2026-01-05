import { RuleConditionFieldEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Ref, useImperativeHandle, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';
import { RulePrefillConditionInterface, RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { ruleEngineService } from '../service/rule-engine.service';
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

interface UseSuggestRuleBottomSheetOptions {
    readonly ref: Ref<BottomSheetInterface<SuggestRuleDataInterface> | null>;
    readonly onRuleCreated?: () => void;
}

export const useSuggestRuleBottomSheet = ({ ref, onRuleCreated }: UseSuggestRuleBottomSheetOptions) => {
    const { t } = useLingui();
    const modalRef = useRef<BottomSheetInterface | null>(null);
    const [data, setData] = useState<SuggestRuleDataInterface | null>(null);
    const [selectedFields, setSelectedFields] = useState<RuleConditionFieldEnum[]>([RuleConditionFieldEnum.TITLE]);
    const [applyToExisting, setApplyToExisting] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useImperativeHandle(ref, (): BottomSheetInterface<SuggestRuleDataInterface> => ({
        open: (openData?: SuggestRuleDataInterface) => {
            if (isDefined(openData)) {
                setData(openData);
                setSelectedFields([RuleConditionFieldEnum.TITLE]);
                setApplyToExisting(true);
            }
            modalRef.current?.open();
        },
        close: () => void modalRef.current?.close(),
        dismiss: () => void modalRef.current?.dismiss()
    }));

    const toggleField = (field: RuleConditionFieldEnum) => {
        setSelectedFields(current => {
            const isSelected = current.includes(field);

            return isSelected ? current.filter(currentField => currentField !== field) : [...current, field];
        });
    };

    const handleConfigureRule = () => {
        if (!isDefined(data)) {
            return;
        }

        modalRef.current?.close();
        router.push({ pathname: '/rules/create', params: { prefill: JSON.stringify(buildPrefillData(selectedFields, data, applyToExisting)) } });
    };

    const handleCreateRule = async () => {
        if (!isDefined(data)) {
            return;
        }

        setIsCreating(true);
        try {
            const ruleInput = buildRuleInputFromPrefill(buildPrefillData(selectedFields, data, applyToExisting));
            const rule = await ruleService.create(ruleInput);

            if (applyToExisting) {
                await ruleEngineService.applyRuleToMatchingTransactions(rule.id);
            }

            onRuleCreated?.();
            modalRef.current?.close();
        } catch {
            Toast.show({ type: 'error', text1: t`Could not create rule`, text2: t`Please try again later` });
        } finally {
            setIsCreating(false);
        }
    };

    return {
        modalRef,
        data,
        selectedFields,
        toggleField,
        applyToExisting,
        setApplyToExisting,
        isCreating,
        close: () => void modalRef.current?.close(),
        handleCreateRule,
        handleConfigureRule,
        hasComment: isDefined(data) && isNotEmptyString(data.comment),
        hasMccCode: isDefined(data) && isNotEmptyString(data.mccCode),
        hasSelectedFields: selectedFields.length > 0
    };
};
