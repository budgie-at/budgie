import { Text, View } from 'react-native';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';

interface Props {
    readonly label: string;
    readonly isPositive: boolean;
    readonly testID?: string;
    readonly maxFontSizeMultiplier?: number;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const YieldDeltaPill = ({ label, isPositive, testID, maxFontSizeMultiplier }: Props) => {
    if (!isPositive) {
        return <MetaPill label={label} testID={testID} maxFontSizeMultiplier={maxFontSizeMultiplier} />;
    }

    return (
        <View className="flex-row">
            <View
                testID={testID}
                className="max-w-full flex-row items-center rounded-full border border-positive-corner bg-positive-background px-sm py-[2px] dark:border-[#30D158]/30 dark:bg-[#30D158]/16"
                style={CONTINUOUS_CORNERS}
            >
                <Text
                    className="shrink text-xs font-semibold text-positive-foreground dark:text-[#30D158]"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    maxFontSizeMultiplier={maxFontSizeMultiplier}
                >
                    {label}
                </Text>
            </View>
        </View>
    );
};
