/* eslint-disable lingui/no-unlocalized-strings */
import {
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleCreateInputInterface,
    RuleCreateInputSchema
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useFieldArray, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { ruleService } from '../service/rule.service';

const DEFAULT_CONDITION = {
    field: RuleConditionFieldEnum.TITLE,
    operator: RuleConditionOperatorEnum.CONTAINS,
    value: '',
    secondaryValue: null
};

const DEFAULT_ACTION = {
    type: RuleActionTypeEnum.SET_CATEGORY,
    categoryId: null,
    tagId: null
};

const DEFAULT_VALUES: RuleCreateInputInterface = {
    title: '',
    priority: 0,
    enabled: true,
    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
    conditions: [DEFAULT_CONDITION],
    actions: [DEFAULT_ACTION]
};

interface UseRuleFormOptions {
    ruleId?: number;
    defaultValues?: RuleCreateInputInterface | null;
}

export const useRuleForm = (options: UseRuleFormOptions = {}) => {
    const { ruleId, defaultValues: providedDefaultValues } = options;
    const defaultValues = providedDefaultValues ?? DEFAULT_VALUES;
    const isEditing = isDefined(ruleId);

    const form = useForm<RuleCreateInputInterface>({
        resolver: zodResolver(RuleCreateInputSchema),
        defaultValues,
        values: defaultValues,
        mode: 'onSubmit'
    });

    const conditionsField = useFieldArray({
        control: form.control,
        name: 'conditions'
    });

    const actionsField = useFieldArray({
        control: form.control,
        name: 'actions'
    });

    const addCondition = () => {
        conditionsField.append(DEFAULT_CONDITION);
    };

    const removeCondition = (index: number) => void (conditionsField.fields.length > 1 && conditionsField.remove(index));

    const addAction = () => {
        actionsField.append(DEFAULT_ACTION);
    };

    const removeAction = (index: number) => void (actionsField.fields.length > 1 && actionsField.remove(index));

    const handleSubmit = async (values: RuleCreateInputInterface) => {
        try {
            if (isEditing && isDefined(ruleId)) {
                await ruleService.updateById(ruleId, values);
            } else {
                await ruleService.create(values);
            }
            router.back();
        } catch {
            Toast.show({
                type: 'error',
                text1: isEditing ? 'Could not update rule' : 'Could not create rule',
                text2: 'Please try again later'
            });
        }
    };

    const onSubmit = () => {
        void form.handleSubmit(handleSubmit)();
    };

    return {
        form,
        conditionsField,
        actionsField,
        addCondition,
        removeCondition,
        addAction,
        removeAction,
        onSubmit,
        isEditing
    };
};
