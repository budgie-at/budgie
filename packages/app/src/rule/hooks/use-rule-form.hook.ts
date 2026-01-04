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
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { ruleService } from '../service/rule.service';

const DEFAULT_VALUES: RuleCreateInputInterface = {
    title: '',
    priority: 0,
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
            tagId: null
        }
    ]
};

interface UseRuleFormOptions {
    ruleId?: number;
    defaultValues?: RuleCreateInputInterface | null;
}

export const useRuleForm = (options: UseRuleFormOptions = {}) => {
    const { t } = useLingui();
    const { ruleId, defaultValues: providedDefaultValues } = options;
    const defaultValues = providedDefaultValues ?? DEFAULT_VALUES;
    const isEditing = isDefined(ruleId);

    const form = useForm<RuleCreateInputInterface>({
        resolver: zodResolver(RuleCreateInputSchema),
        defaultValues,
        values: defaultValues,
        mode: 'onSubmit'
    });

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
                text1: isEditing ? t`Could not update rule` : t`Could not create rule`,
                text2: t`Please try again later`
            });
        }
    };

    const onSubmit = () => {
        void form.handleSubmit(handleSubmit)();
    };

    return { form, onSubmit, isEditing };
};
