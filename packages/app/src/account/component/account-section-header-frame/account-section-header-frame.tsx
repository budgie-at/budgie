import { useAtomValue } from '@effect/atom-react/Hooks';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { StickySectionHeaderBackdrop } from '../../../@generic/component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { toTrueMinus } from '../../../@generic/utils/to-true-minus.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly title: string;
    readonly total: number;
    readonly totalClassName?: string;
    readonly leading?: ReactNode;
    readonly titleAccessory?: ReactNode;
    readonly totalAccessory?: ReactNode;
    readonly children?: ReactNode;
}

export const AccountSectionHeaderFrame = ({ title, total, totalClassName, leading, titleAccessory, totalAccessory, children }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const isStacked = useIsAccessibilityTextSize();

    const titleLineCount = isStacked ? 0 : 1;
    const totalGroupClassName = isStacked ? 'flex-wrap justify-end gap-y-xs' : 'shrink-0';
    const formattedTotal = toTrueMinus(formatDigits(total, defaultInstrument.symbol));

    return (
        <View className="-mx-3xl gap-y-md pt-md pb-md pr-[28px] pl-[32px]">
            <StickySectionHeaderBackdrop />
            <View className={cn('flex-row items-center justify-between gap-x-md', isStacked && 'flex-col items-stretch gap-y-xs')}>
                <View className={cn('min-h-[28px] min-w-0 flex-row items-center gap-x-sm', !isStacked && 'flex-1')}>
                    <View className="w-[8px] items-center overflow-visible">{leading}</View>
                    <Text
                        accessibilityRole="header"
                        maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={titleLineCount}
                        className="shrink text-lg font-semibold text-primary"
                    >
                        {title}
                    </Text>
                    {titleAccessory}
                </View>
                <View className={cn('ml-auto min-h-[28px] flex-row items-center gap-x-sm', totalGroupClassName)}>
                    {totalAccessory}
                    <ProtectedText
                        maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                        className={cn('text-[17px] font-semibold text-primary tabular-nums', totalClassName)}
                    >
                        {formattedTotal}
                    </ProtectedText>
                </View>
            </View>
            {children}
        </View>
    );
};
