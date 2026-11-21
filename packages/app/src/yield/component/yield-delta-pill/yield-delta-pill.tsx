import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { YieldDeltaToneEnum } from '../../enum/yield-delta-tone.enum';

interface Props {
    readonly label: string;
    readonly tone: YieldDeltaToneEnum;
    readonly caption?: string;
    readonly testID?: string;
    readonly maxFontSizeMultiplier?: number;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const pillVariants = cva('max-w-full border', {
    variants: {
        tone: {
            [YieldDeltaToneEnum.POSITIVE]: 'border-yield-delta-positive-corner bg-yield-delta-positive-background',
            [YieldDeltaToneEnum.NEGATIVE]: 'border-destructive-corner bg-destructive-background',
            [YieldDeltaToneEnum.NEUTRAL]: 'border-secondary-corner bg-secondary-background'
        },
        isAccessibilityText: {
            true: 'items-start rounded-[12px] px-[12px] py-[8px]',
            false: 'flex-row items-center rounded-full px-sm py-[2px]'
        }
    }
});
const labelVariants = cva('shrink text-xs font-semibold tabular-nums', {
    variants: {
        tone: {
            [YieldDeltaToneEnum.POSITIVE]: 'text-yield-delta-positive',
            [YieldDeltaToneEnum.NEGATIVE]: 'text-yield-delta-negative',
            [YieldDeltaToneEnum.NEUTRAL]: 'text-secondary-foreground'
        }
    }
});

export const YieldDeltaPill = ({ label, tone, caption = '', testID, maxFontSizeMultiplier = 2 }: Props) => {
    const isAccessibilityText = useIsAccessibilityTextSize();

    const className = labelVariants({ tone });
    const hasCaption = isNotEmptyString(caption);
    const firstLine = isAccessibilityText || !hasCaption ? label : `${label} ${caption}`;
    const captionLine =
        isAccessibilityText && hasCaption ? (
            <Text className={className} maxFontSizeMultiplier={maxFontSizeMultiplier}>
                {caption}
            </Text>
        ) : null;

    return (
        <View className="flex-row">
            <View testID={testID} className={pillVariants({ tone, isAccessibilityText })} style={CONTINUOUS_CORNERS}>
                <Text
                    className={className}
                    ellipsizeMode="tail"
                    maxFontSizeMultiplier={maxFontSizeMultiplier}
                    {...(!isAccessibilityText && { numberOfLines: 1 })}
                >
                    {firstLine}
                </Text>
                {captionLine}
            </View>
        </View>
    );
};
