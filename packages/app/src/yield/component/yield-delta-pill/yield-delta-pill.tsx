import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { YieldDeltaToneEnum } from '../../enum/yield-delta-tone.enum';

interface Props {
    readonly label: string;
    readonly tone: YieldDeltaToneEnum;
    readonly testID?: string;
    readonly maxFontSizeMultiplier?: number;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const pillVariants = cva('max-w-full flex-row items-center rounded-full border px-sm py-[2px]', {
    variants: {
        tone: {
            [YieldDeltaToneEnum.POSITIVE]: 'border-positive-corner bg-positive-background dark:border-[#30D158]/30 dark:bg-[#30D158]/16',
            [YieldDeltaToneEnum.NEGATIVE]: 'border-destructive-corner bg-destructive-background',
            [YieldDeltaToneEnum.NEUTRAL]: 'border-secondary-corner bg-secondary-background'
        }
    }
});
const labelVariants = cva('shrink text-xs font-semibold', {
    variants: {
        tone: {
            [YieldDeltaToneEnum.POSITIVE]: 'text-positive-foreground dark:text-[#30D158]',
            [YieldDeltaToneEnum.NEGATIVE]: 'text-destructive-foreground',
            [YieldDeltaToneEnum.NEUTRAL]: 'text-secondary-foreground'
        }
    }
});

export const YieldDeltaPill = ({ label, tone, testID, maxFontSizeMultiplier }: Props) => (
    <View className="flex-row">
        <View testID={testID} className={pillVariants({ tone })} style={CONTINUOUS_CORNERS}>
            <Text className={labelVariants({ tone })} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={maxFontSizeMultiplier}>
                {label}
            </Text>
        </View>
    </View>
);
