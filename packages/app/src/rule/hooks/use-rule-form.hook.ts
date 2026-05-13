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

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';
import { ruleApplicationDrainerService } from '../service/rule-application-drainer.service';
import { ruleMatcherService } from '../service/rule-matcher.service';
import { ruleService } from '../service/rule.service';

import type { RuleFormResultType } from '../context/rule-form-modal.context';

type UseRuleFormOptionsInterface = {
    readonly ruleId?: number;
    readonly defaultValues?: RuleCreateInputInterface | null;
    readonly prefillData?: RulePrefillDataInterface | null;
    readonly onSuccess?: (result: RuleFormResultType) => void;
};

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
    ]
};

const buildRuleInputFromPrefill = (prefillData: RulePrefillDataInterface): RuleCreateInputInterface => {
    const categoryAction: RuleCreateInputInterface['actions'] = isDefined(prefillData.categoryId)
        ? [{ type: RuleActionTypeEnum.SET_CATEGORY, categoryId: prefillData.categoryId, tagId: null, accountId: null }]
        : [];

    const tagActions: RuleCreateInputInterface['actions'] = prefillData.tagIds.map(tagId => ({
        type: RuleActionTypeEnum.ADD_TAG,
        categoryId: null,
        tagId,
        accountId: null
    }));

    const actions: RuleCreateInputInterface['actions'] = [...categoryAction, ...tagActions];

    const conditions: RuleCreateInputInterface['conditions'] = prefillData.conditions.map(condition => ({
        field: condition.field,
        operator: RuleConditionOperatorEnum.CONTAINS,
        value: condition.value,
        secondaryValue: null
    }));

    return {
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions,
        actions
    };
};

const resolveDefaultValues = (
    providedDefaultValues: RuleCreateInputInterface | null | undefined,
    prefillData: RulePrefillDataInterface | null | undefined
): RuleCreateInputInterface => {
    if (isDefined(providedDefaultValues)) {
        return providedDefaultValues;
    }
    if (isDefined(prefillData)) {
        return buildRuleInputFromPrefill(prefillData);
    }

    return DEFAULT_VALUES;
};

export const useRuleForm = (options: UseRuleFormOptionsInterface = {}) => {
    const { t } = useLingui();
    const { ruleId, defaultValues: providedDefaultValues, prefillData, onSuccess } = options;

    const defaultValues: RuleCreateInputInterface = resolveDefaultValues(providedDefaultValues, prefillData);
    const isEditing = isDefined(ruleId);

    const form = useForm<RuleCreateInputInterface>({
        resolver: zodResolver(RuleCreateInputSchema),
        defaultValues,
        mode: 'onSubmit'
    });

    const confirmApplyToExisting = async (values: RuleCreateInputInterface): Promise<boolean> => {
        const hasConditions = values.conditions.some(condition => isNotEmptyString(condition.value));
        if (!hasConditions) {
            return false;
        }

        const count = await ruleMatcherService.countMatchingTransactions({
            conditions: values.conditions,
            conditionMatchType: values.conditionMatchType
        });

        if (!isPositiveNumber(count)) {
            return false;
        }

        return confirmAlert({
            title: t`Apply to existing transactions?`,
            message: t`${count} existing transactions match this rule.`,
            confirmText: t`Apply`,
            cancelText: t`Skip`
        });
    };

    const enqueueApply = (targetRuleId: number, shouldApply: boolean): void => {
        if (shouldApply) {
            ruleApplicationDrainerService.enqueueRuleApplication(targetRuleId);
        }
    };

    const handleSubmit = async (values: RuleCreateInputInterface) => {
        try {
            const shouldApply = await confirmApplyToExisting(values);

            if (isEditing && isDefined(ruleId)) {
                await ruleService.updateById(ruleId, values);
                enqueueApply(ruleId, shouldApply);
            } else {
                const rule = await ruleService.create(values);
                enqueueApply(rule.id, shouldApply);
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
