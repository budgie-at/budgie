import { useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { RuleFormContent } from '../../../rule/components/rule-form-content/rule-form-content';
import { useRuleForm } from '../../../rule/hooks/use-rule-form.hook';

export default function CreateRulePage() {
    const { t } = useLingui();
    const { form, onSubmit } = useRuleForm();

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
                footer={
                    <KeyboardStickyView>
                        <Footer>
                            <Button variant="ghost" onPress={onSubmit} content={t`Create Rule`} />
                        </Footer>
                    </KeyboardStickyView>
                }
            >
                <RuleFormContent />
            </Page>
        </FormProvider>
    );
}
