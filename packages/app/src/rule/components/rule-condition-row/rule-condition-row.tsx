import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { RuleConditionSelectors } from '../../../@e2e/selectors/rule-condition.selector';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { RuleConditionFieldSelector } from '../rule-condition-field-selector/rule-condition-field-selector';
import { RuleConditionOperatorSelector } from '../rule-condition-operator-selector/rule-condition-operator-selector';
import { RuleConditionValueInput } from '../rule-condition-value-input/rule-condition-value-input';

interface Props {
    readonly index: number;
    readonly onRemove: (index: number) => void;
    readonly canRemove: boolean;
}

export const RuleConditionRow = ({ index, onRemove, canRemove }: Props) => {
    const handleRemove = () => void onRemove(index);
    const conditionNumber = index + 1;

    return (
        <View
            testID={RuleConditionSelectors.Row(index)}
            className="bg-secondary-background/50 rounded-2xl p-xl gap-y-lg border border-secondary-corner"
        >
            <View className="flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-sm font-medium">
                    <Trans>Condition {conditionNumber}</Trans>
                </Text>

                {canRemove && (
                    <HapticPressable testID={RuleConditionSelectors.RemoveButton(index)} onPress={handleRemove} className="p-xs">
                        <Icon icon={UserIconNameEnum.Trash2} className="text-destructive-foreground" size={18} />
                    </HapticPressable>
                )}
            </View>

            <View className="flex-row gap-x-lg">
                <RuleConditionFieldSelector index={index} testID={RuleConditionSelectors.FieldSelector(index)} />
                <RuleConditionOperatorSelector index={index} testID={RuleConditionSelectors.OperatorSelector(index)} />
            </View>

            <RuleConditionValueInput
                index={index}
                testID={RuleConditionSelectors.ValueInput(index)}
                secondaryTestID={RuleConditionSelectors.SecondaryValueInput(index)}
            />
        </View>
    );
};
