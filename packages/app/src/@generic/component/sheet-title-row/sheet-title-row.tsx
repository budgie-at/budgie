import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly title: string;
    readonly maxFontSizeMultiplier?: number;
    readonly closeButtonSize?: number;
}

export const SheetTitleRow = ({ title, maxFontSizeMultiplier, closeButtonSize = 36 }: Props) => {
    const { t } = useLingui();
    const closeButtonStyle = { width: closeButtonSize, height: closeButtonSize };
    const handleClose = () => void router.back();

    return (
        <View className="flex-row items-center">
            <HapticPressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={t`Close`}
                hitSlop={8}
                className="items-center justify-center rounded-full bg-surface-fill active:opacity-70"
                style={closeButtonStyle}
            >
                <Icon icon={UserIconNameEnum.X} size={16} className="text-primary/80" />
            </HapticPressable>
            <Text
                className="text-primary flex-1 text-center text-[17px] font-semibold leading-[22px]"
                accessibilityRole="header"
                maxFontSizeMultiplier={maxFontSizeMultiplier}
            >
                {title}
            </Text>
            <View style={closeButtonStyle} />
        </View>
    );
};
