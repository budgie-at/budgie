import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { Button } from '../../../@generic/component/button/button';
import { useRuleFormModal } from '../../../rule/context/rule-form-modal.context';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';

interface Props {
    readonly assignment: CategorizeInboxAssignmentInterface;
}

export const CategorizeInboxMakeRuleButton = ({ assignment }: Props) => {
    const { t } = useLingui();
    const { openRuleForm } = useRuleFormModal();

    const handlePress = () =>
        void openRuleForm({
            prefillData: {
                conditions: [
                    {
                        field: RuleConditionFieldEnum.TITLE,
                        operator: RuleConditionOperatorEnum.CONTAINS,
                        value: assignment.ruleConditionValue
                    }
                ],
                categoryId: assignment.categoryId,
                tagIds: []
            }
        });

    return <Button content={t`Make rule`} onPress={handlePress} size="sm" variant="ghost" />;
};
