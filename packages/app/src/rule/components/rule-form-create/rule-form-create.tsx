import { useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';

import { RuleFormResultType } from '../../context/rule-form-modal.context';
import { useRuleForm } from '../../hooks/use-rule-form.hook';
import { RulePrefillDataInterface } from '../../interface/rule-prefill-data.interface';
import { RuleFormScreen } from '../rule-form-screen/rule-form-screen';
import { RuleFormSubmitBar } from '../rule-form-submit-bar/rule-form-submit-bar';

interface Props {
    readonly prefillData?: RulePrefillDataInterface;
    readonly onSuccess: (result: RuleFormResultType) => void;
    readonly onCancel: () => void;
}

export const RuleFormCreate = ({ prefillData, onSuccess, onCancel }: Props) => {
    const { t } = useLingui();
    const { form, handleSubmit, isSubmitting } = useRuleForm({ prefillData, onSuccess });

    return (
        <FormProvider {...form}>
            <RuleFormScreen
                title={t`Create Rule`}
                onCancel={onCancel}
                footer={<RuleFormSubmitBar submitLabel={t`Create rule`} isSubmitting={isSubmitting} onSubmit={handleSubmit} />}
            />
        </FormProvider>
    );
};
