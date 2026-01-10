import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { RuleFormContent } from '../../../rule/components/rule-form-content/rule-form-content';
import { RuleFormFooter } from '../../../rule/components/rule-form-footer/rule-form-footer';
import { useRuleForm } from '../../../rule/hooks/use-rule-form.hook';
import { RulePrefillDataInterface } from '../../../rule/interface/rule-prefill-data.interface';
import { RulePrefillDataSchema } from '../../../rule/schema/rule-prefill-data.schema';

const parsePrefillData = (prefillJson: string | undefined): RulePrefillDataInterface | null => {
    if (!isDefined(prefillJson)) {
        return null;
    }

    try {
        const parsed: unknown = JSON.parse(prefillJson);
        const result = RulePrefillDataSchema.safeParse(parsed);

        return result.success ? result.data : null;
    } catch {
        return null;
    }
};

export default function CreateRulePage() {
    const { t } = useLingui();
    const { prefill } = useLocalSearchParams<{ prefill?: string }>();
    const prefillData = parsePrefillData(prefill);
    const { form, handleSubmit } = useRuleForm({ prefillData });

    const handleGoBack = () => void goBackOrReplace('/settings/rules');

    return (
        <FormProvider {...form}>
            <Page
                header={
                    <PageHeader
                        title={t`Create Rule`}
                        onGoBack={handleGoBack}
                        description={t`Define conditions and actions for your rule`}
                    />
                }
                footer={<RuleFormFooter onSubmit={handleSubmit} variant="ghost" buttonText={t`Create Rule`} />}
            >
                <RuleFormContent />
            </Page>
        </FormProvider>
    );
}
