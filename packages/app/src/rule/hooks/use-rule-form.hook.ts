import {
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleCreateInputInterface,
    RuleCreateInputSchema
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { RuleFormResultType } from '../context/rule-form-modal.context';
import { RuleCreationProgressInterface } from '../interface/rule-creation-progress.interface';
import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';
import { ruleEngineService } from '../service/rule-engine.service';
import { ruleService } from '../service/rule.service';
import { buildRuleInputFromPrefill } from '../util/build-rule-input-from-prefill.util';

const DEFAULT_VALUES: RuleCreateInputInterface = {
    enabled: true,
    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
    conditions: [
        {
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: '',
            secondaryValue: null
        }
    ],
    actions: [
        {
            type: RuleActionTypeEnum.SET_CATEGORY,
            categoryId: null,
            tagId: null,
            accountId: null
        }
    ],
    applyToExisting: false
};

interface UseRuleFormOptions {
    ruleId?: number;
    defaultValues?: RuleCreateInputInterface | null;
    prefillData?: RulePrefillDataInterface | null;
    onSuccess?: (result: RuleFormResultType) => void;
}

export const useRuleForm = (options: UseRuleFormOptions = {}) => {
    const { t } = useLingui();
    const { ruleId, defaultValues: providedDefaultValues, prefillData, onSuccess } = options;
    const [progress, setProgress] = useState<RuleCreationProgressInterface | null>(null);

    const getDefaultValues = (): RuleCreateInputInterface => {
        if (isDefined(providedDefaultValues)) {
            return providedDefaultValues;
        }

        if (isDefined(prefillData)) {
            return buildRuleInputFromPrefill(prefillData);
        }

        return DEFAULT_VALUES;
    };

    const defaultValues = getDefaultValues();
    const isEditing = isDefined(ruleId);

    const form = useForm<RuleCreateInputInterface>({
        resolver: zodResolver(RuleCreateInputSchema),
        defaultValues,
        values: defaultValues,
        mode: 'onSubmit'
    });

    const showApplyResultToast = (applied: number, failed: number) => {
        if (failed === 0) {
            Toast.show({ type: 'success', text1: t`Rule applied to ${applied} transactions` });

            return;
        }

        Toast.show({ type: 'error', text1: t`${applied} updated, ${failed} failed` });
    };

    const handleProgress = (processed: number, total: number) => {
        setProgress({ processed, total });
    };

    const applyRuleToExisting = async (targetRuleId: number, shouldApply: boolean) => {
        if (shouldApply) {
            const result = await ruleEngineService.applyRuleToMatchingTransactions(targetRuleId, handleProgress);
            setProgress(null);
            showApplyResultToast(result.applied, result.failed);
        }
    };

    const handleSubmit = async (values: RuleCreateInputInterface) => {
        try {
            if (isEditing && isDefined(ruleId)) {
                await ruleService.updateById(ruleId, values);
                await applyRuleToExisting(ruleId, values.applyToExisting);
            } else {
                const rule = await ruleService.create(values);
                await applyRuleToExisting(rule.id, values.applyToExisting);
            }
            onSuccess?.(isEditing ? 'updated' : 'created');
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: isEditing ? t`Could not update rule` : t`Could not create rule`,
                text2: getErrorMessage(error)
            });
        }
    };

    const handleDelete = async () => {
        if (!isDefined(ruleId)) {
            return;
        }

        try {
            await ruleService.archiveById(ruleId);
            onSuccess?.('deleted');
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Could not delete rule.`,
                text2: getErrorMessage(error)
            });
        }
    };

    return { form, handleSubmit: form.handleSubmit(handleSubmit), handleDelete, isEditing, progress };
};
