import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { Button } from '../../../@generic/component/button/button';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { RuleFormResultType } from '../../context/rule-form-modal.context';
import { useRuleForm } from '../../hooks/use-rule-form.hook';
import { useGetRuleByIdQuery } from '../../query/use-get-rule-by-id.query';
import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';
import { RuleFormApplyToggle } from '../rule-form-apply-toggle/rule-form-apply-toggle';

interface Props {
    readonly ruleId: number;
    readonly onSuccess: (result: RuleFormResultType) => void;
    readonly onCancel: () => void;
}

export const RuleFormEdit = ({ ruleId, onSuccess, onCancel }: Props) => {
    const { t } = useLingui();
    const { rule, isLoading } = useGetRuleByIdQuery(ruleId);

    const defaultValues = isDefined(rule)
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
              })),
              applyToExisting: false
          }
        : null;

    const { form, handleSubmit, handleDelete, progress } = useRuleForm({ ruleId, defaultValues, onSuccess });
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

    return (
        <FormProvider {...form}>
            <ModalPage header={<PageHeader testID={RuleFormSelectors.Page} title={t`Edit Rule`} onGoBack={onCancel} />}>
                <KeyboardAwareScrollView
                    contentContainerClassName="pb-5xl"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-3xl gap-y-3xl">
                        <RuleConditionsSection />
                        <RuleActionsSection ruleId={ruleId} />
                    </View>
                    <View className="px-3xl mt-3xl">
                        <RuleFormApplyToggle progress={progress} />
                    </View>
                </KeyboardAwareScrollView>

                <View className="px-3xl pb-3xl gap-y-md pt-xl">
                    <Button
                        testID={RuleFormSelectors.DeleteButton}
                        leftIcon={UserIconNameEnum.Trash2}
                        onPress={handleDeleteConfirm}
                        variant="destructive"
                        content={t`Delete rule`}
                    />
                    <View className="flex-row gap-x-md">
                        <ModalFormCancelButton onPress={onCancel} />
                        <ModalFormSaveButton testID={RuleFormSelectors.SubmitButton} onPress={handleSubmit} isLoading={isSubmitting} />
                    </View>
                </View>
            </ModalPage>
        </FormProvider>
    );
};
