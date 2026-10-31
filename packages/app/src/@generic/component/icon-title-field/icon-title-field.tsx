import { isEmojiIcon, UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { useIconSearchEntries } from '../../hook/use-icon-search-entries.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType;
    readonly variant: ColorPaletteVariant;
    readonly label: string;
    readonly onIconPress: () => void;
    readonly error?: string;
    readonly iconTriggerTestID?: string;
    readonly iconTestID?: string;
    readonly children: ReactNode;
}

const ICON_HIT_SLOP = 4;

export const IconTitleField = (props: Props) => {
    const { icon, variant, label, onIconPress, error, iconTriggerTestID, iconTestID, children } = props;
    const { t } = useLingui();
    const iconName = useIconSearchEntries().find(entry => entry.icon === icon)?.label ?? icon;
    const iconSize = isEmojiIcon(icon) ? 22 : 18;

    return (
        <View className="px-3xl py-lg">
            <View className="flex-row items-center gap-x-xl">
                <HapticPressable
                    onPress={onIconPress}
                    accessibilityRole="button"
                    accessibilityLabel={t`Change icon, current: ${iconName}`}
                    hitSlop={ICON_HIT_SLOP}
                    className="active:opacity-70"
                    testID={iconTriggerTestID}
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
                <View className="flex-1">
                    <Text className="text-secondary-foreground text-[13px]" importantForAccessibility="no" accessibilityElementsHidden>
                        {label}
                    </Text>
                    {children}
                </View>
            </View>
            {isNotEmptyString(error) ? <Text className="text-destructive-foreground pl-[48px] text-[13px]">{error}</Text> : null}
        </View>
    );
};
