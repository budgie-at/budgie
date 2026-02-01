import {
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleCreateInputInterface,
    RuleCreateInputSchema
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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

export const useRuleForm = (input?: RuleCreateInputInterface) =>
    useForm<RuleCreateInputInterface>({
        resolver: zodResolver(RuleCreateInputSchema),
        defaultValues: input ?? DEFAULT_VALUES,
        values: input ?? DEFAULT_VALUES,
        mode: 'onSubmit'
    });
