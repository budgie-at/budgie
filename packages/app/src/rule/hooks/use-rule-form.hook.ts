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
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { UseRuleFormOptionsInterface } from '../interface/use-rule-form-options.interface';
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

// eslint-disable-next-line max-lines-per-function -- Form hook with confirm alert logic and create/update/delete handlers
export const useRuleForm = (options: UseRuleFormOptionsInterface = {}) => {
    const { t } = useLingui();
    const { ruleId, defaultValues: providedDefaultValues, prefillData, onSuccess } = options;

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

    const confirmApplyToExisting = async (values: RuleCreateInputInterface): Promise<boolean> => {
        const hasConditions = values.conditions.some(condition => isNotEmptyString(condition.value));
        if (!hasConditions) {
            return false;
        }

        const count = await ruleEngineService.countMatchingTransactions({
            conditions: values.conditions,
            conditionMatchType: values.conditionMatchType
        });

        if (count <= 0) {
            return false;
        }

        return confirmAlert({
            title: t`Apply to existing transactions?`,
            message: t`${count} existing transactions match this rule.`,
            confirmText: t`Apply`,
            cancelText: t`Skip`
        });
    };

    const applyRuleToExisting = async (targetRuleId: number, shouldApply: boolean) => {
        if (shouldApply) {
            const result = await ruleEngineService.applyRuleToMatchingTransactions(targetRuleId);
            showApplyResultToast(result.applied, result.failed);
        }
    };

    const handleSubmit = async (values: RuleCreateInputInterface) => {
        try {
            const shouldApply = await confirmApplyToExisting(values);

            if (isEditing && isDefined(ruleId)) {
                await ruleService.updateById(ruleId, values);
                await applyRuleToExisting(ruleId, shouldApply);
            } else {
                const rule = await ruleService.create(values);
                await applyRuleToExisting(rule.id, shouldApply);
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

    return { form, handleSubmit: form.handleSubmit(handleSubmit), handleDelete, isEditing };
};
