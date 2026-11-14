import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { CREATE_MENU_LARGE_TEXT_FONT_SCALE } from '../../constant/create-menu-large-text-font-scale.constant';
import { CREATE_MENU_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/create-menu-max-font-size-multiplier.constant';
import { CREATE_MENU_MIN_FONT_SCALE } from '../../constant/create-menu-min-font-scale.constant';
import { CreateMenuLabelLayoutEnum } from '../../enum/create-menu-label-layout.enum';
import { splitCreateMenuLabel } from '../../utils/split-create-menu-label.util';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { ClassValue } from 'cn';
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
}

const ICON_SIZE = 20;
const LABEL_CLASSNAME = 'text-md font-semibold leading-tight text-tile-foreground';

const tileFillVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'grow flex-row items-center gap-md rounded-5xl bg-linear-to-br pl-lg pr-xl',
    {
        variants: {
            variant: {
                default: 'from-default-tile to-default-tile-deep',
                destructive: 'from-destructive-tile to-destructive-tile-deep',
                positive: 'from-positive-tile to-positive-tile-deep',
                warning: 'from-warning-tile to-warning-tile-deep',
                'dark-warning': 'from-warning-tile to-warning-tile-deep',
                violet: 'from-violet-tile to-violet-tile-deep',
                cyan: 'from-cyan-tile to-cyan-tile-deep',
                pink: 'from-neutral-tile to-neutral-tile-deep',
                ghost: 'from-neutral-tile to-neutral-tile-deep',
                secondary: 'from-neutral-tile to-neutral-tile-deep',
                primary: 'from-neutral-tile to-neutral-tile-deep',
                cta: 'from-neutral-tile to-neutral-tile-deep'
            }
        }
    }
);

export const CreateMenuTileContent = ({ icon, label, testID, variant }: Props) => {
    const { fontScale } = useWindowDimensions();
    const [labelLayout, setLabelLayout] = useState(CreateMenuLabelLayoutEnum.PENDING);

    const isLargeText = fontScale >= CREATE_MENU_LARGE_TEXT_FONT_SCALE;
    const tileHeightClassName = isLargeText ? 'h-[68px] py-xs' : 'h-[64px] py-xxs';
    const lines = labelLayout === CreateMenuLabelLayoutEnum.SPLIT ? splitCreateMenuLabel(label) : [label];
    const lineClassName = labelLayout === CreateMenuLabelLayoutEnum.PENDING ? `opacity-0 ${LABEL_CLASSNAME}` : LABEL_CLASSNAME;

    const handleMeasureLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
        setLabelLayout(event.nativeEvent.lines.length > 1 ? CreateMenuLabelLayoutEnum.SPLIT : CreateMenuLabelLayoutEnum.SINGLE);
    };

    return (
        <View className={tileFillVariants({ variant, className: tileHeightClassName })}>
            <View className="absolute inset-x-0 top-0 h-1/2 rounded-t-5xl bg-linear-to-b from-tile-foreground/10 to-tile-foreground/0" />
            <View className="h-[40px] w-[40px] items-center justify-center rounded-full bg-tile-foreground/20">
                <Icon className="text-tile-foreground" icon={icon} size={ICON_SIZE} />
            </View>
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
