import { isDefined } from '@rnw-community/shared';

import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { RuleFormCreate } from '../rule/components/rule-form-create/rule-form-create';
import { RuleFormEdit } from '../rule/components/rule-form-edit/rule-form-edit';

export default function RuleFormModal() {
    const { params: currentParams, resolve: resolveRuleForm } = useModalRoute('/rule-form');

    const handleCancel = () => {
        resolveRuleForm(null);
    };

    if (isDefined(currentParams?.ruleId)) {
        return <RuleFormEdit ruleId={currentParams.ruleId} onSuccess={resolveRuleForm} onCancel={handleCancel} />;
    }

    return <RuleFormCreate prefillData={currentParams?.prefillData} onSuccess={resolveRuleForm} onCancel={handleCancel} />;
}
