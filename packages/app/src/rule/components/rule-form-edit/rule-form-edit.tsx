import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { Button } from '../../../@generic/component/button/button';
import { FormSheetSpacer } from '../../../@generic/component/form-sheet-spacer/form-sheet-spacer';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
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
}

export const RuleFormEdit = ({ ruleId, onSuccess }: Props) => {
    const { t } = useLingui();
    const { backgroundColor } = useFormsheetListStyles();
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

    const { form, handleSubmit, handleDelete } = useRuleForm({ ruleId, defaultValues, onSuccess });

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

    const containerStyle = { flex: 1, backgroundColor };

    if (isLoading || !isDefined(rule)) {
        return <LoadingScreen />;
    }

    return (
        <FormProvider {...form}>
            <View testID={RuleFormSelectors.Page} style={containerStyle}>
                <KeyboardAwareScrollView
                    contentContainerClassName="pb-5xl"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <BottomSheetHeader size="md" title={t`Edit Rule`} />
                    <View className="px-5xl gap-y-7xl">
                        <RuleConditionsSection />
                        <RuleActionsSection />
                    </View>
                    <View className="px-5xl mt-3xl">
                        <RuleFormApplyToggle />
                    </View>
                    <View className="px-5xl pt-5xl flex-row gap-x-md">
                        <Button
                            testID={RuleFormSelectors.DeleteButton}
                            leftIcon={UserIconNameEnum.Trash2}
                            onPress={handleDeleteConfirm}
                            variant="destructive"
                        />
                        <Button
                            testID={RuleFormSelectors.SubmitButton}
                            leftIcon={UserIconNameEnum.CircleCheck}
                            onPress={handleSubmit}
                            variant="ghost"
                            className="flex-1"
                            content={t`Save Changes`}
                        />
                    </View>
                </KeyboardAwareScrollView>
                <FormSheetSpacer />
            </View>
        </FormProvider>
    );
};
