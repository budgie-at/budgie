import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
    readonly isPositive: boolean;
    readonly testID?: string;
    readonly maxFontSizeMultiplier?: number;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const pillVariants = cva('max-w-full flex-row items-center rounded-full border px-sm py-[2px]', {
    variants: {
        isPositive: {
            true: 'border-positive-corner bg-positive-background dark:border-[#30D158]/30 dark:bg-[#30D158]/16',
            false: 'border-secondary-corner bg-secondary-background'
        }
    }
});
const labelVariants = cva('shrink text-xs font-semibold', {
    variants: {
        isPositive: {
            true: 'text-positive-foreground dark:text-[#30D158]',
            false: 'text-destructive-foreground'
        }
    }
});

export const YieldDeltaPill = ({ label, isPositive, testID, maxFontSizeMultiplier }: Props) => (
    <View className="flex-row">
        <View testID={testID} className={pillVariants({ isPositive })} style={CONTINUOUS_CORNERS}>
            <Text
                className={labelVariants({ isPositive })}
                numberOfLines={1}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={maxFontSizeMultiplier}
            >
                {label}
            </Text>
        </View>
    </View>
);
