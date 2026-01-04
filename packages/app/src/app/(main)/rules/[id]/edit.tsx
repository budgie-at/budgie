import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { Footer } from '../../../../@generic/component/footer/footer';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { RuleFormContent } from '../../../../rule/components/rule-form-content/rule-form-content';
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

    const { form, onSubmit } = useRuleForm({ ruleId, defaultValues });

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(rule)) {
        return <Redirect href="/" />;
    }

    const handleGoBack = () => void goBackOrReplace('/settings/rules');

    return (
        <FormProvider {...form}>
            <Page
                header={<PageHeader title={t`Edit Rule`} onGoBack={handleGoBack} description={t`Define conditions and actions for your rule`} />}
                footer={
                    <KeyboardStickyView>
                        <Footer>
                            <Button variant="dark-warning" onPress={onSubmit} content={t`Save Changes`} />
                        </Footer>
                    </KeyboardStickyView>
                }
            >
                <RuleFormContent />
            </Page>
        </FormProvider>
    );
}
