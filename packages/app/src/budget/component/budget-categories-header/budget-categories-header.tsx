import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly onAdd: () => void;
}

export const BudgetCategoriesHeader = ({ onAdd }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row items-center justify-between">
            <Text className="text-xs uppercase text-secondary-foreground">
                <Trans>Categories</Trans>
            </Text>
            <HapticPressable className="flex-row items-center gap-1" onPress={onAdd}>
                <Icon icon="Plus" size={14} className="text-primary" />
                <Text className="text-xs text-primary">{t`Add`}</Text>
            </HapticPressable>
        </View>
    );
};

