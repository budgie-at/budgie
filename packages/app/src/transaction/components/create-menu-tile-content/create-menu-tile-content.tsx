import { Text, View } from 'react-native';

import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { CREATE_MENU_MIN_FONT_SCALE } from '../../constant/create-menu-min-font-scale.constant';
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

export const CreateMenuTileContent = ({ icon, label, testID, variant }: Props) => (
    <View className="min-h-[64px] flex-row items-center gap-lg rounded-5xl bg-popover-surface px-xl py-sm">
        <CreateMenuIcon icon={icon} variant={variant} size={ICON_SIZE} />
        <Text
            className="flex-1 text-md font-semibold text-primary"
            maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={CREATE_MENU_MIN_FONT_SCALE}
            {...testIDProps(testID, TestIDPartEnum.LABEL)}
        >
            {label}
        </Text>
    </View>
);
