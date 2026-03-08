import { useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { RuleFormResultType } from '../../context/rule-form-modal.context';
import { useRuleForm } from '../../hooks/use-rule-form.hook';
import { RulePrefillDataInterface } from '../../interface/rule-prefill-data.interface';
import { RuleFormButtons } from '../rule-form-buttons/rule-form-buttons';
import { RuleFormLayout } from '../rule-form-layout/rule-form-layout';

interface Props {
    readonly prefillData?: RulePrefillDataInterface;
    readonly onSuccess: (result: RuleFormResultType) => void;
    readonly onCancel: () => void;
}

export const RuleFormCreate = ({ prefillData, onSuccess, onCancel }: Props) => {
    const { t } = useLingui();
    const { form, handleSubmit } = useRuleForm({ prefillData, onSuccess });
    const { isSubmitting } = form.formState;

    const header = <PageHeader testID={RuleFormSelectors.Page} title={t`Create Rule`} onGoBack={onCancel} />;

    const footer = <RuleFormButtons onCancel={onCancel} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;

    return (
        <FormProvider {...form}>
            <RuleFormLayout header={header} footer={footer} />
        </FormProvider>
    );
};
