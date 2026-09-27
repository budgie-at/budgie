import { RuleConditionFieldEnum, RuleConditionOperatorEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useRuleFormModal } from '../../../rule/context/rule-form-modal.context';
import { CategorizeInboxUndoBarSelector } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';

interface Props {
    readonly assignment: Pick<CategorizeInboxAssignmentInterface, 'categoryId' | 'ruleConditionValue'>;
}

export const CategorizeInboxRuleButton = ({ assignment }: Props) => {
    const { t } = useLingui();
    const { openRuleForm } = useRuleFormModal();

    const handlePress = (): void =>
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

    return (
        <HapticPressable
            onPress={handlePress}
            className="h-11 w-11 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={t`Create a rule`}
            testID={CategorizeInboxUndoBarSelector.RuleButton}
        >
            <Icon icon={UserIconNameEnum.Zap} size={18} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
