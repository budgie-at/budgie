import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { CREATE_MENU_LARGE_TEXT_FONT_SCALE } from '../../constant/create-menu-large-text-font-scale.constant';
import { CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/create-menu-max-font-size-multiplier.constant';
import { CREATE_MENU_MIN_FONT_SCALE } from '../../constant/create-menu-min-font-scale.constant';
import { CreateMenuLabelLayoutEnum } from '../../enum/create-menu-label-layout.enum';
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

const ICON_SIZE = 40;
const LABEL_CLASSNAME = 'text-md font-semibold leading-tight text-primary';
const TILE_CLASSNAME = 'grow flex-row items-center gap-md rounded-5xl bg-popover-surface pl-lg pr-xl';

export const CreateMenuTileContent = ({ icon, label, testID, variant }: Props) => {
    const { fontScale } = useWindowDimensions();
    const [labelLayout, setLabelLayout] = useState(CreateMenuLabelLayoutEnum.PENDING);

    const isLargeText = fontScale >= CREATE_MENU_LARGE_TEXT_FONT_SCALE;
    const tileClassName = isLargeText ? `h-[68px] py-xs ${TILE_CLASSNAME}` : `h-[64px] py-xxs ${TILE_CLASSNAME}`;
    const lines = labelLayout === CreateMenuLabelLayoutEnum.SPLIT ? splitCreateMenuLabel(label) : [label];
    const lineClassName = labelLayout === CreateMenuLabelLayoutEnum.PENDING ? `opacity-0 ${LABEL_CLASSNAME}` : LABEL_CLASSNAME;

    const handleMeasureLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
        setLabelLayout(event.nativeEvent.lines.length > 1 ? CreateMenuLabelLayoutEnum.SPLIT : CreateMenuLabelLayoutEnum.SINGLE);
    };

    return (
        <View className={tileClassName}>
            <CreateMenuIcon icon={icon} variant={variant} size={ICON_SIZE} />
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
                        className={lineClassName}
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
