import { Text, View, useWindowDimensions } from 'react-native';

import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/create-menu-max-font-size-multiplier.constant';
import { CREATE_MENU_MIN_FONT_SCALE } from '../../constant/create-menu-min-font-scale.constant';
import { splitCreateMenuLabel } from '../../utils/split-create-menu-label.util';
import { CreateMenuIcon } from '../create-menu-icon/create-menu-icon';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
}

const ICON_SIZE = 36;
const LARGE_TEXT_ICON_SIZE = 32;
const LARGE_TEXT_FONT_SCALE = 1.3;

export const CreateMenuTileContent = ({ icon, label, testID, variant }: Props) => {
    const { fontScale } = useWindowDimensions();

    const iconSize = fontScale >= LARGE_TEXT_FONT_SCALE ? LARGE_TEXT_ICON_SIZE : ICON_SIZE;

    return (
        <View className="min-h-[64px] grow flex-row items-center gap-md rounded-5xl bg-popover-surface py-sm pl-lg pr-xl">
            <CreateMenuIcon icon={icon} variant={variant} size={iconSize} />
            <View className="flex-1" {...testIDProps(testID, TestIDPartEnum.LABEL)}>
                {splitCreateMenuLabel(label).map(line => (
                    <Text
                        key={line}
                        className="text-md font-semibold leading-tight text-primary"
                        maxFontSizeMultiplier={CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={CREATE_MENU_MIN_FONT_SCALE}
                    >
                        {line}
                    </Text>
                ))}
            </View>
        </View>
    );
};
