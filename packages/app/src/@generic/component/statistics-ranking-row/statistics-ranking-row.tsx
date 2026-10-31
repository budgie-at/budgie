import { UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/footnote-max-font-size-multiplier.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/row-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../hook/use-is-accessibility-text-size.hook';
import { useIsAmountProtected } from '../../hook/use-is-amount-protected.hook';
import { cn } from '../../utils/cn.util';
import { GrowBar } from '../grow-bar/grow-bar';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { ProtectedText } from '../protected-text/protected-text';
import { StatisticsRankingIcon } from '../statistics-ranking-icon/statistics-ranking-icon';

import type { ChartSwatchInterface } from '../../interface/chart-swatch.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly share: number;
    readonly ratio: number;
    readonly icon: UserIconType;
    readonly swatch: ChartSwatchInterface | null;
    readonly amount: ReactNode;
    readonly testID: string;
    readonly onPress: () => void;
}

const headlineVariants = cva('gap-x-md', {
    variants: { isStacked: { true: 'gap-y-xs', false: 'flex-row items-center' } }
});

const amountSlotVariants = cva('', {
    variants: { isStacked: { true: '', false: 'ml-auto' } }
});

const SHARE_STYLE = { fontVariant: ['tabular-nums' as const] };

export const StatisticsRankingRow = ({ title, share, ratio, icon, swatch, amount, testID, onPress }: Props) => {
    const isStacked = useIsAccessibilityTextSize();
    const isAmountProtected = useIsAmountProtected();
    const formatPercent = useFormatPercent();

    const shareLabel = formatPercent(share);
    const titleLineCount = isStacked ? 3 : 2;
    const barClassName = isDefined(swatch) ? swatch.fill : 'bg-secondary-foreground';
    const leading = <StatisticsRankingIcon icon={icon} swatch={swatch} />;

    return (
        <HapticPressable
            accessibilityRole="button"
            className="min-h-[56px] flex-row items-center gap-x-xl py-lg pr-xl pl-3xl active:scale-100 active:bg-surface-fill"
            hitSlop={0}
            testID={testID}
            onPress={onPress}
        >
            {isStacked ? null : leading}

            <View className="flex-1 gap-y-sm">
                {isStacked ? leading : null}

                <View className={headlineVariants({ isStacked })}>
                    <Text
                        numberOfLines={titleLineCount}
                        ellipsizeMode="tail"
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                        className="flex-shrink text-[15px] text-primary"
                    >
                        {title}
                    </Text>

                    <View className={amountSlotVariants({ isStacked })}>{amount}</View>
                </View>

                <View className="flex-row items-center gap-x-md">
                    <View className="h-[4px] flex-1 overflow-hidden rounded-full bg-primary/10">
                        {isAmountProtected ? null : <GrowBar ratio={ratio} className={cn('h-full rounded-full', barClassName)} />}
                    </View>

                    <ProtectedText
                        placeholderText="••%"
                        maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        style={SHARE_STYLE}
                        className="min-w-[40px] text-right text-xs text-secondary-foreground"
                    >
                        {shareLabel}
                    </ProtectedText>
                </View>
            </View>

            {isStacked ? null : <Icon icon={UserIconNameEnum.ChevronRight} size={14} className="text-secondary-foreground/60" />}
        </HapticPressable>
    );
};
