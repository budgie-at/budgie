import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Fragment } from 'react';
import { FormProvider } from 'react-hook-form';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { RuleFormResultType } from '../../context/rule-form-modal.context';
import { useRuleForm } from '../../hooks/use-rule-form.hook';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';
import { RuleFormScreen } from '../rule-form-screen/rule-form-screen';
import { RuleFormSubmitBar } from '../rule-form-submit-bar/rule-form-submit-bar';

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
                        title: t`Delete this rule?`,
                        message: t`Payments it already changed stay as they are.`,
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

    return (
        <FormProvider {...form}>
            <RuleFormScreen
                title={t`Edit Rule`}
                onCancel={onCancel}
                ruleId={rule.id}
                footer={<RuleFormSubmitBar submitLabel={t`Save changes`} isSubmitting={isSubmitting} onSubmit={handleSubmit} />}
            >
                <GroupedListSection footer={t`Payments this rule already changed stay as they are.`}>
                    <SettingsRow
                        icon={UserIconNameEnum.Trash2}
                        variant="destructive"
                        title={t`Delete rule`}
                        onPress={handleDeleteConfirm}
                        right={<Fragment />}
                        testID={RuleFormSelector.DeleteButton}
                        titleTestID={RuleFormSelector.DeleteButtonLabel}
                    />
                </GroupedListSection>
            </RuleFormScreen>
        </FormProvider>
    );
};
