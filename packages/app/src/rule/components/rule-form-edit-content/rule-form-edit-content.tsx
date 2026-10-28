import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { FormProvider } from 'react-hook-form';

import { Button } from '../../../@generic/component/button/button';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { RuleFormResultType } from '../../context/rule-form-modal.context';
import { useRuleForm } from '../../hooks/use-rule-form.hook';
import { RuleFormButtons } from '../rule-form-buttons/rule-form-buttons';
import { RuleFormLayout } from '../rule-form-layout/rule-form-layout';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

import type { RuleCreateInputInterface, RuleWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly rule: RuleWithRelationsEntityInterface;
    readonly onSuccess: (result: RuleFormResultType) => void;
    readonly onCancel: () => void;
}

export const RuleFormEditContent = ({ rule, onSuccess, onCancel }: Props) => {
    const { t } = useLingui();
    const defaultValues: RuleCreateInputInterface = {
        enabled: rule.enabled,
        conditionMatchType: rule.conditionMatchType,
        conditions: rule.conditions.map(condition => ({
            field: condition.field,
            value: condition.value,
            operator: condition.operator,
            secondaryValue: condition.secondaryValue
        })),
        actions: rule.actions.map(action => ({
            type: action.type,
            tagId: action.tagId,
            categoryId: action.categoryId,
            accountId: action.accountId ?? null
        }))
    };

    const { form, handleSubmit, handleDelete, isSubmitting } = useRuleForm({ ruleId: rule.id, defaultValues, onSuccess });

    const handleDeleteConfirm = () => {
        appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const confirmed = yield* confirmAlert({
                        title: t`Are you sure you want to delete this rule?`,
                        message: t`This action cannot be undone.`,
                        confirmText: t`Delete`,
                        cancelText: t`Cancel`,
                        isDestructive: true
                    });

                    if (confirmed) {
                        handleDelete();
                    }
                })
            )
        );
    };

    const header = <PageHeader title={t`Edit Rule`} onGoBack={onCancel} />;

    const footer = (
        <RuleFormButtons onCancel={onCancel} onSubmit={handleSubmit} isSubmitting={isSubmitting}>
            <Button
                testID={RuleFormSelector.DeleteButton}
                leftIcon={UserIconNameEnum.Trash2}
                onPress={handleDeleteConfirm}
                variant="destructive"
                content={t`Delete rule`}
            />
        </RuleFormButtons>
    );

    return (
        <FormProvider {...form}>
            <RuleFormLayout header={header} footer={footer} ruleId={rule.id} />
        </FormProvider>
    );
};
