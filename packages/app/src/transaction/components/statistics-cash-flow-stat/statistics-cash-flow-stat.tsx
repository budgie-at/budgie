import { Text, View } from 'react-native';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly valueClassName: string;
}

export const StatisticsCashFlowStat = ({ label, value, valueClassName }: Props) => (
    <View accessible className="flex-1 gap-y-xxs px-3xl py-lg">
        <Text numberOfLines={1} maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
            {label}
        </Text>

        <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
            maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
            className={cn('text-[17px] font-semibold tabular-nums', valueClassName)}
        >
            {value}
        </Text>
    </View>
);
