import { Trans, useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { Footer } from '../../../../@generic/component/footer/footer';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { RuleActionRow } from '../../../../rule/components/rule-action-row/rule-action-row';
import { RuleConditionMatchTypeSelector } from '../../../../rule/components/rule-condition-match-type-selector/rule-condition-match-type-selector';
import { RuleConditionRow } from '../../../../rule/components/rule-condition-row/rule-condition-row';
import { RuleFormDetailsSection } from '../../../../rule/components/rule-form-details-section/rule-form-details-section';
import { RuleFormSectionHeader } from '../../../../rule/components/rule-form-section-header/rule-form-section-header';
import { useRuleForm } from '../../../../rule/hooks/use-rule-form.hook';
import { useGetRuleByIdQuery } from '../../../../rule/query/use-get-rule-by-id.query';

export default function EditRulePage() {
    const { t } = useLingui();
    const { id } = useLocalSearchParams<{ id: string }>();
    const ruleId = Number(id);
    const { rule, isLoading } = useGetRuleByIdQuery(ruleId);

    const defaultValues = isDefined(rule)
        ? {
              title: rule.title,
              priority: rule.priority,
              enabled: rule.enabled,
              conditionMatchType: rule.conditionMatchType,
              conditions: rule.conditions.map(condition => ({
                  field: condition.field,
                  value: condition.value,
                  operator: condition.operator,
                  secondaryValue: condition.secondaryValue
              })),
              actions: rule.actions.map(action => ({ type: action.type, tagId: action.tagId, categoryId: action.categoryId }))
          }
        : null;

    const { form, conditionsField, actionsField, addCondition, removeCondition, addAction, removeAction, onSubmit } = useRuleForm({
        ruleId,
        defaultValues
    });

    const handleGoBack = () => void goBackOrReplace('/settings/rules');
    const canRemoveCondition = conditionsField.fields.length > 1;
    const canRemoveAction = actionsField.fields.length > 1;

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(rule)) {
        return <Redirect href="/" />;
    }

    /* jscpd:ignore-start */
    return (
        <FormProvider {...form}>
            <Page
                header={
                    <PageHeader title={t`Edit Rule`} onGoBack={handleGoBack} description={t`Define conditions and actions for your rule`} />
                }
                footer={
                    <KeyboardStickyView>
                        <Footer>
                            <Button variant="dark-warning" onPress={onSubmit} content={t`Save Changes`} />
                        </Footer>
                    </KeyboardStickyView>
                }
            >
                <KeyboardAwareScrollView
                    contentContainerClassName="pb-5xl"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="py-5xl gap-y-7xl">
                        <RuleFormDetailsSection />

                        <View className="gap-y-lg">
                            <RuleFormSectionHeader title={t`Conditions`} onAdd={addCondition} />
                            <RuleConditionMatchTypeSelector conditionCount={conditionsField.fields.length} />

                            {conditionsField.fields.map((field, index) => (
                                <RuleConditionRow key={field.id} index={index} onRemove={removeCondition} canRemove={canRemoveCondition} />
                            ))}
                        </View>

                        <View className="gap-y-lg">
                            <RuleFormSectionHeader title={t`Actions`} onAdd={addAction} />

                            <Text className="text-secondary-foreground text-sm">
                                <Trans>Actions to apply when conditions match</Trans>
                            </Text>

                            {actionsField.fields.map((field, index) => (
                                <RuleActionRow key={field.id} index={index} onRemove={removeAction} canRemove={canRemoveAction} />
                            ))}
                        </View>
                    </View>
                </KeyboardAwareScrollView>
            </Page>
        </FormProvider>
    );
    /* jscpd:ignore-end */
}
