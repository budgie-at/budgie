import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/create-menu-max-font-size-multiplier.constant';
import { CREATE_MENU_MIN_FONT_SCALE } from '../../constant/create-menu-min-font-scale.constant';
import { splitCreateMenuLabel } from '../../utils/split-create-menu-label.util';
import { CreateMenuIcon } from '../create-menu-icon/create-menu-icon';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
}

const ICON_SIZE = 36;
const LARGE_TEXT_ICON_SIZE = 32;
const LARGE_TEXT_FONT_SCALE = 1.3;
const LABEL_CLASSNAME = 'text-md font-semibold leading-tight text-primary';

export const CreateMenuTileContent = ({ icon, label, testID, variant }: Props) => {
    const { fontScale } = useWindowDimensions();
    const [isWrapped, setIsWrapped] = useState(false);

    const iconSize = fontScale >= LARGE_TEXT_FONT_SCALE ? LARGE_TEXT_ICON_SIZE : ICON_SIZE;
    const lines = isWrapped ? splitCreateMenuLabel(label) : [label];

    const handleMeasureLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
        setIsWrapped(event.nativeEvent.lines.length > 1);
    };

    return (
        <View className="min-h-[64px] grow flex-row items-center gap-md rounded-5xl bg-popover-surface py-xxs pl-lg pr-xl">
            <CreateMenuIcon icon={icon} variant={variant} size={iconSize} />
            <View className="flex-1" {...testIDProps(testID, TestIDPartEnum.LABEL)}>
                <Text
                    className={`absolute inset-x-0 top-0 opacity-0 ${LABEL_CLASSNAME}`}
                    maxFontSizeMultiplier={CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER}
                    onTextLayout={handleMeasureLayout}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                >
                    {label}
                </Text>
                {lines.map(line => (
                    <Text
                        key={line}
                        className={LABEL_CLASSNAME}
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
