import { RuleActionTypeEnum, RuleCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { RuleActionSelectors } from '../../../@e2e/selectors/rule-action.selector';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { RuleActionAccountSelector } from '../rule-action-account-selector/rule-action-account-selector';
import { RuleActionCategorySelector } from '../rule-action-category-selector/rule-action-category-selector';
import { RuleActionTagSelector } from '../rule-action-tag-selector/rule-action-tag-selector';
import { RuleActionTypeSelector } from '../rule-action-type-selector/rule-action-type-selector';

interface Props {
    readonly index: number;
    readonly onRemove: (index: number) => void;
    readonly canRemove: boolean;
}

export const RuleActionRow = ({ index, onRemove, canRemove }: Props) => {
    const { control } = useFormContext<RuleCreateInputInterface>();
    const actionType = useWatch({ control, name: `actions.${index}.type` });
    const actionNumber = index + 1;

    const handleRemove = () => void onRemove(index);

    return (
        <View
            testID={RuleActionSelectors.Row(index)}
            className="bg-secondary-background/50 rounded-2xl p-xl gap-y-lg border border-secondary-corner"
        >
            <View className="flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-sm font-medium">
                    <Trans>Action {actionNumber}</Trans>
                </Text>

                {canRemove && (
                    <HapticPressable testID={RuleActionSelectors.RemoveButton(index)} onPress={handleRemove} className="p-xs">
                        <Icon icon={UserIconNameEnum.Trash2} className="text-destructive-foreground" size={18} />
                    </HapticPressable>
                )}
            </View>

            <RuleActionTypeSelector index={index} testID={RuleActionSelectors.TypeSelector(index)} />

            {actionType === RuleActionTypeEnum.SET_CATEGORY && (
                <RuleActionCategorySelector index={index} testID={RuleActionSelectors.CategorySelector(index)} />
            )}
            {actionType === RuleActionTypeEnum.ADD_TAG && (
                <RuleActionTagSelector index={index} testID={RuleActionSelectors.TagSelector(index)} />
            )}
            {actionType === RuleActionTypeEnum.CONVERT_TO_TRANSFER && (
                <RuleActionAccountSelector index={index} testID={RuleActionSelectors.AccountSelector(index)} />
            )}
        </View>
    );
};
