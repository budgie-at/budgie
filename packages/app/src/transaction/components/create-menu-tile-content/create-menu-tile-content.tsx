import { Text, View } from 'react-native';

import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/create-menu-max-font-size-multiplier.constant';
import { CreateMenuIcon } from '../create-menu-icon/create-menu-icon';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
}

const ICON_SIZE = 40;

export const CreateMenuTileContent = ({ icon, label, testID, variant }: Props) => (
    <View className="min-h-[64px] flex-row items-center gap-xl rounded-5xl bg-popover-surface px-xl py-sm">
        <CreateMenuIcon icon={icon} variant={variant} size={ICON_SIZE} />
        <Text
            className="flex-1 text-md font-semibold text-primary"
            maxFontSizeMultiplier={CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER}
            numberOfLines={2}
            {...testIDProps(testID, TestIDPartEnum.LABEL)}
        >
            {label}
        </Text>
    </View>
);
