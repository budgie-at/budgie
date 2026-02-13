import { isDefined } from '@rnw-community/shared';

import { RuleFormCreate } from '../rule/components/rule-form-create/rule-form-create';
import { RuleFormEdit } from '../rule/components/rule-form-edit/rule-form-edit';
import { RuleFormResultType, useRuleFormModal } from '../rule/context/rule-form-modal.context';

export default function RuleFormModal() {
    const { currentParams, resolveRuleForm } = useRuleFormModal();

    const handleSuccess = (result: RuleFormResultType) => {
        resolveRuleForm(result);
    };

    if (isDefined(currentParams?.ruleId)) {
        return <RuleFormEdit ruleId={currentParams.ruleId} onSuccess={handleSuccess} />;
    }

    return <RuleFormCreate prefillData={currentParams?.prefillData} onSuccess={handleSuccess} />;
}
