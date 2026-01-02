import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly onAdd: EmptyFn;
}

export const BudgetCategoriesHeader = ({ onAdd }: Props) => (
    <View className="flex-row items-center justify-between">
        <Text className="text-xs uppercase text-secondary-foreground">
            <Trans>Categories</Trans>
        </Text>
        <HapticPressable className="flex-row items-center gap-1" onPress={onAdd}>
            <Icon icon="Plus" size={14} className="text-primary" />
            <Text className="text-xs text-primary">
                <Trans>Add</Trans>
            </Text>
        </HapticPressable>
    </View>
);
