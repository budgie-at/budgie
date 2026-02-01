import { RuleForm, RuleFormResult } from '../rule/components/rule-form/rule-form';
import { useRuleFormModal } from '../rule/context/rule-form-modal.context';

export default function RuleFormModal() {
    const { currentParams, resolveRuleForm } = useRuleFormModal();

    const handleSuccess = (result: RuleFormResult) => {
        resolveRuleForm(result);
    };

    const handleCancel = () => {
        resolveRuleForm(null);
    };

    return <RuleForm ruleId={currentParams?.ruleId} input={currentParams?.input} onSuccess={handleSuccess} onCancel={handleCancel} />;
}
