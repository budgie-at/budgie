import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly title: string;
}

export const SheetTitleRow = ({ title }: Props) => {
    const { t } = useLingui();
    const handleClose = () => void router.back();

    return (
        <View className="flex-row items-center">
            <HapticPressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={t`Close`}
                hitSlop={8}
                className="h-[36px] w-[36px] items-center justify-center rounded-full bg-surface-fill active:opacity-70"
            >
                <Icon icon={UserIconNameEnum.X} size={16} className="text-primary/80" />
            </HapticPressable>
            <Text className="text-primary flex-1 text-center text-[17px] font-semibold leading-[22px]" accessibilityRole="header">
                {title}
            </Text>
            <View className="w-[36px]" />
        </View>
    );
};
