import { isEmojiIcon, UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { useIconSearchEntries } from '../../hook/use-icon-search-entries.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly icon: UserIconType;
    readonly variant: ColorPaletteVariant;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly iconTestID?: string;
}

const ICON_HIT_SLOP = 6;

export const IconTitleFieldTrigger = ({ icon, variant, onPress, testID, iconTestID }: Props) => {
    const { t } = useLingui();
    const iconName = useIconSearchEntries().find(entry => entry.icon === icon)?.label ?? icon;
    const iconSize = isEmojiIcon(icon) ? 22 : 18;

    return (
        <HapticPressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={t`Change icon, current: ${iconName}`}
            accessibilityHint={t`Opens the icon picker`}
            hitSlop={ICON_HIT_SLOP}
            className="active:opacity-70"
            testID={testID}
        >
            <View testID={iconTestID}>
                <CircleIcon
                    variant={variant}
                    size={36}
                    iconSize={iconSize}
                    radius={18}
                    border={false}
                    icon={icon}
                    className={TONAL_DISC_BACKGROUND[variant]}
                />
            </View>
            <View className="absolute -right-[3px] -bottom-[3px] h-[20px] w-[20px] items-center justify-center rounded-full border-2 border-grouped-surface-row bg-surface-disc">
                <Icon icon={UserIconNameEnum.Pencil} size={11} className="text-primary" />
            </View>
        </HapticPressable>
    );
};
