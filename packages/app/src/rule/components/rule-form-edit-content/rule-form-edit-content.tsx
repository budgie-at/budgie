import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';

import { Button } from '../../../@generic/component/button/button';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
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

    const { form, handleSubmit, handleDelete } = useRuleForm({ ruleId: rule.id, defaultValues, onSuccess });
    const { isSubmitting } = form.formState;

    const handleDeleteConfirm = async () => {
        const confirmed = await confirmAlert({
            title: t`Are you sure you want to delete this rule?`,
            message: t`This action cannot be undone.`,
            confirmText: t`Delete rule`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (confirmed) {
            await handleDelete();
        }
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
