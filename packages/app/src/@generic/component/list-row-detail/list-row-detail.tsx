import { Text, View } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/row-max-font-size-multiplier.constant';
import { cn } from '../../utils/cn.util';

interface Props {
    readonly segments: readonly string[];
    readonly className?: string;
    readonly testID?: string;
}

export const ListRowDetail = ({ segments, className, testID }: Props) => (
    <View className="overflow-hidden" testID={testID} accessible accessibilityLabel={segments.join(', ')}>
        <View className="-ml-[14px] flex-row flex-wrap">
            {segments.map(segment => (
                <View key={segment} className="flex-row">
                    <Text
                        className={cn('w-[14px] text-center text-[13px] leading-[18px] text-secondary-foreground', className)}
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    >
                        ·
                    </Text>
                    <Text
                        className={cn('text-[13px] leading-[18px] text-secondary-foreground tabular-nums', className)}
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    >
                        {segment}
                    </Text>
                </View>
            ))}
        </View>
    </View>
);
