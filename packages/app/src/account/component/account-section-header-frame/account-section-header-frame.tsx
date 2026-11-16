import { useAtomValue } from '@effect/atom-react/Hooks';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { StickySectionHeaderBackdrop } from '../../../@generic/component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
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

    const formattedTotal = toTrueMinus(formatDigits(total, defaultInstrument.symbol));

    return (
        <View className="-mx-3xl gap-y-md pt-md pb-md pr-[28px] pl-[32px]">
            <StickySectionHeaderBackdrop />
            <View className="flex-row flex-wrap items-start justify-between gap-x-md">
                <View className="min-h-[28px] min-w-0 shrink flex-row items-center gap-x-sm">
                    <View className="w-[8px] items-center overflow-visible">{leading}</View>
                    <Text
                        accessibilityRole="header"
                        maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                        className="shrink text-lg font-semibold text-primary"
                    >
                        {title}
                    </Text>
                    {titleAccessory}
                </View>
                <View className="items-end">
                    <View className="min-h-[28px] justify-center">
                        <ProtectedText
                            maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                            className={cn('text-[17px] font-semibold text-primary tabular-nums', totalClassName)}
                        >
                            {formattedTotal}
                        </ProtectedText>
                    </View>
                    {totalAccessory}
                </View>
            </View>
            {children}
        </View>
    );
};
