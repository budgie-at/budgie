import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { RuleFormContent } from '../../../rule/components/rule-form-content/rule-form-content';
import { RuleFormFooter } from '../../../rule/components/rule-form-footer/rule-form-footer';
import { useRuleForm } from '../../../rule/hooks/use-rule-form.hook';
import { parseRulePrefillData } from '../../../rule/util/parse-rule-prefill-data.util';

export default function CreateRulePage() {
    const { t } = useLingui();
    const { prefill } = useLocalSearchParams<{ prefill?: string }>();
    const prefillData = parseRulePrefillData(prefill);
    const { form, handleSubmit } = useRuleForm({ prefillData });

    const handleGoBack = () => void goBackOrReplace('/settings/rules');

    return (
        <FormProvider {...form}>
            <Page
                testID={RuleFormSelectors.Page}
                header={
                    <PageHeader
                        testID={RuleFormSelectors.Header}
                        title={t`Create Rule`}
                        onGoBack={handleGoBack}
                        description={t`Define conditions and actions for your rule`}
                    />
                }
                footer={
                    <RuleFormFooter
                        submitTestID={RuleFormSelectors.SubmitButton}
                        onSubmit={handleSubmit}
                        variant="ghost"
                        buttonText={t`Create Rule`}
                    />
                }
            >
                <RuleFormContent />
            </Page>
        </FormProvider>
    );
}
