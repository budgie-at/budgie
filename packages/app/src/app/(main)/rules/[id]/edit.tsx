import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { RuleFormContent } from '../../../../rule/components/rule-form-content/rule-form-content';
import { RuleFormFooter } from '../../../../rule/components/rule-form-footer/rule-form-footer';
import { useRuleForm } from '../../../../rule/hooks/use-rule-form.hook';
import { useGetRuleByIdQuery } from '../../../../rule/query/use-get-rule-by-id.query';

export default function EditRulePage() {
    const { t } = useLingui();
    const { id } = useLocalSearchParams<{ id: string }>();
    const ruleId = Number(id);
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
              actions: rule.actions.map(action => ({ type: action.type, tagId: action.tagId, categoryId: action.categoryId })),
              applyToExisting: false
          }
        : null;

    const { form, handleSubmit, handleDelete } = useRuleForm({ ruleId, defaultValues });

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
                header={
                    <PageHeader title={t`Edit Rule`} onGoBack={handleGoBack} description={t`Define conditions and actions for your rule`} />
                }
                footer={<RuleFormFooter onDelete={handleDelete} onSubmit={handleSubmit} variant="ghost" buttonText={t`Save Changes`} />}
            >
                <RuleFormContent />
            </Page>
        </FormProvider>
    );
}
