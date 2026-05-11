import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';
import { FormProvider } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { RuleFormResultType } from '../../context/rule-form-modal.context';
import { useRuleForm } from '../../hooks/use-rule-form.hook';
import { useGetRuleByIdQuery } from '../../query/use-get-rule-by-id.query';
import { RuleFormButtons } from '../rule-form-buttons/rule-form-buttons';
import { RuleFormLayout } from '../rule-form-layout/rule-form-layout';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

import type { RuleCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly ruleId: number;
    readonly onSuccess: (result: RuleFormResultType) => void;
    readonly onCancel: () => void;
}

export const RuleFormEdit = ({ ruleId, onSuccess, onCancel }: Props) => {
    const { t } = useLingui();
    const { rule, isLoading } = useGetRuleByIdQuery(ruleId);

    const defaultValues = useMemo<RuleCreateInputInterface | null>(
        () =>
            isDefined(rule)
                ? {
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
                  }
                : null,
        [rule]
    );

    const { form, handleSubmit, handleDelete } = useRuleForm({ ruleId, defaultValues, onSuccess });
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

    if (isLoading || !isDefined(rule)) {
        return <LoadingScreen />;
    }

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
            <RuleFormLayout header={header} footer={footer} ruleId={ruleId} />
        </FormProvider>
    );
};
