import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { CREATE_MENU_MIN_FONT_SCALE } from '../../constant/create-menu-min-font-scale.constant';
import { createMenuButtonAccessibility } from '../../utils/create-menu-button-accessibility.util';
import { CreateMenuIcon } from '../create-menu-icon/create-menu-icon';

import type { CreateMenuItemPropsInterface } from '../../interface/create-menu-item-props.interface';

const ICON_SIZE = 28;
const HIT_SLOP = 4;

export const CreateMenuChip = ({ icon, label, testID, variant, onPress }: CreateMenuItemPropsInterface) => (
    <HapticPressable
        className="shrink"
        collapsable={false}
        hitSlop={HIT_SLOP}
        onPress={onPress}
        testID={testID}
        {...createMenuButtonAccessibility(label)}
    >
        <View className="min-h-[40px] flex-row items-center gap-md rounded-full bg-popover-surface pl-sm pr-2xl">
            <CreateMenuIcon icon={icon} variant={variant} size={ICON_SIZE} />
            <Text
                className="shrink text-sm font-semibold text-primary"
                maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
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
