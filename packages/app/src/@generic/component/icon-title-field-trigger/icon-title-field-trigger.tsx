import { isEmojiIcon, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { useIconSearchEntries } from '../../hook/use-icon-search-entries.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly icon: UserIconType;
    readonly variant: ColorPaletteVariant;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly iconTestID?: string;
}

const ICON_HIT_SLOP = 4;

export const IconTitleFieldTrigger = ({ icon, variant, onPress, testID, iconTestID }: Props) => {
    const { t } = useLingui();
    const iconName = useIconSearchEntries().find(entry => entry.icon === icon)?.label ?? icon;
    const iconSize = isEmojiIcon(icon) ? 22 : 20;

    return (
        <HapticPressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={t`Change icon`}
            accessibilityHint={t`Current icon: ${iconName}. Opens the icon picker.`}
            hitSlop={ICON_HIT_SLOP}
            className="size-[44px] items-center justify-center active:opacity-70"
            testID={testID}
        >
            <View testID={iconTestID}>
                <CircleIcon
                    variant={variant}
                    size={40}
                    iconSize={iconSize}
                    radius={20}
                    border={false}
                    icon={icon}
                    className={TONAL_DISC_BACKGROUND[variant]}
                />
            </View>
        </HapticPressable>
    );
};
