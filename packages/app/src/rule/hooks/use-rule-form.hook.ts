import {
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleCreateInputInterface,
    RuleCreateInputSchema
} from '@budgie/contracts';
import { RuleMatcherService, RuleService } from '@budgie/rules';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useForm } from 'react-hook-form';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useEffectAction } from '../../@generic/hook/use-effect-action.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';
import { RuleApplicationDrainerService } from '../service/rule-application-drainer.service';
import { showRuleApplicationToast } from '../utils/show-rule-application-toast.util';

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
        operator: condition.operator,
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
    const [runSubmit, isSaving] = useEffectAction(isEditing ? t`Could not update rule` : t`Could not create rule`);
    const [runDelete, isDeleting] = useEffectAction(t`Could not delete rule.`);

    const form = useForm<RuleCreateInputInterface>({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(RuleCreateInputSchema)),
        defaultValues,
        mode: 'onSubmit'
    });

    const confirmApplyToExisting = Effect.fn('useRuleForm.confirmApplyToExisting')(function* (values: RuleCreateInputInterface) {
        const hasConditions = values.conditions.some(condition => isNotEmptyString(condition.value));
        if (!hasConditions) {
            return false;
        }

        const ruleMatcherService = yield* RuleMatcherService;
        const count = yield* ruleMatcherService.countMatchingTransactions({
            conditions: values.conditions,
            conditionMatchType: values.conditionMatchType
        });

        if (!isPositiveNumber(count)) {
            return false;
        }

        return yield* Effect.promise(() =>
            confirmAlert({
                title: t`Apply to existing transactions?`,
                message: t({
                    message: plural(count, {
                        one: '# existing transaction matches this rule.',
                        other: '# existing transactions match this rule.'
                    })
                }),
                confirmText: t`Apply`,
                cancelText: t`Skip`
            })
        );
    });

    const enqueueApplyToExisting = Effect.fn('useRuleForm.enqueueApplyToExisting')(function* (targetRuleId: number, shouldApply: boolean) {
        if (!shouldApply) {
            return;
        }

        const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;
        yield* ruleApplicationDrainerService.enqueueRuleApplication(targetRuleId, showRuleApplicationToast);
    });

    const submitRule = Effect.fn('useRuleForm.submitRule')(function* (values: RuleCreateInputInterface) {
        const shouldApply = yield* confirmApplyToExisting(values);
        const ruleService = yield* RuleService;

        if (isDefined(ruleId)) {
            yield* ruleService.updateById(ruleId, values);
            yield* enqueueApplyToExisting(ruleId, shouldApply);
        } else {
            const rule = yield* ruleService.create(values);
            yield* enqueueApplyToExisting(rule.id, shouldApply);
        }
    });

    const handleSubmit = (values: RuleCreateInputInterface) => {
        runSubmit(submitRule(values), () => void onSuccess?.(isEditing ? 'updated' : 'created'));
    };

    const handleDelete = () => {
        if (isDefined(ruleId)) {
            runDelete(
                Effect.flatMap(RuleService, ruleService => ruleService.archiveById(ruleId)),
                () => void onSuccess?.('deleted')
            );
        }
    };

    return { form, handleSubmit: form.handleSubmit(handleSubmit), handleDelete, isEditing, isSubmitting: isSaving || isDeleting };
};
