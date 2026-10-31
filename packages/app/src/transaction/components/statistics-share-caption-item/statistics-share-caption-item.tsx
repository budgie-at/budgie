import { Text, View } from 'react-native';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly shareLabel: string;
    readonly swatchClassName: string;
}

export const StatisticsShareCaptionItem = ({ label, shareLabel, swatchClassName }: Props) => (
    <View className="max-w-full flex-row items-center gap-x-sm">
        <View className={cn('size-[8px] rounded-full', swatchClassName)} />
        <Text
            numberOfLines={2}
            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            className="shrink text-xs text-secondary-foreground"
        >
            {label}
        </Text>
        <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-xs font-medium tabular-nums text-primary">
            {shareLabel}
        </Text>
    </View>
);
