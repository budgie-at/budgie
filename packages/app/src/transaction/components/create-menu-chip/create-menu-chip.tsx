import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/create-menu-max-font-size-multiplier.constant';
import { CREATE_MENU_MIN_FONT_SCALE } from '../../constant/create-menu-min-font-scale.constant';
import { createMenuButtonAccessibility } from '../../utils/create-menu-button-accessibility.util';

import type { CreateMenuItemPropsInterface } from '../../interface/create-menu-item-props.interface';

const ICON_SIZE = 14;
const HIT_SLOP = 4;

export const CreateMenuChip = ({ icon, label, testID, onPress }: CreateMenuItemPropsInterface) => (
    <HapticPressable
        className="flex-1"
        collapsable={false}
        hitSlop={HIT_SLOP}
        onPress={onPress}
        testID={testID}
        {...createMenuButtonAccessibility(label)}
    >
        <View className="min-h-[40px] flex-row items-center gap-md rounded-full border-hairline border-popover-border bg-popover-surface pl-sm pr-2xl">
            <View className="size-[28px] items-center justify-center rounded-full bg-secondary-foreground/15">
                <Icon className="text-secondary-foreground" icon={icon} size={ICON_SIZE} />
            </View>
            <Text
                className="flex-1 text-sm font-semibold text-primary"
                maxFontSizeMultiplier={CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={CREATE_MENU_MIN_FONT_SCALE}
                {...testIDProps(testID, TestIDPartEnum.LABEL)}
            >
                {label}
            </Text>
        </View>
    </HapticPressable>
);
