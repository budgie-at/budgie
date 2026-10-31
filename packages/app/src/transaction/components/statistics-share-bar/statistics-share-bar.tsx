import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { getShare } from '../../../@generic/utils/get-share.util';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';
import { StatisticsShareCaptionItem } from '../statistics-share-caption-item/statistics-share-caption-item';

import type { StatisticsShareSegmentInterface } from '../../interface/statistics-share-segment.interface';

interface Props {
    readonly segments: readonly StatisticsShareSegmentInterface[];
    readonly other: StatisticsShareSegmentInterface | null;
    readonly onOtherPress: () => void;
}

const CAPTION_SEGMENT_COUNT = 3;
const SEGMENT_TRANSITION_DURATION = 240;
const SEGMENT_TRANSITION = LinearTransition.duration(SEGMENT_TRANSITION_DURATION);

export const StatisticsShareBar = ({ segments, other, onOtherPress }: Props) => {
    const { t } = useLingui();
    const [isBreakdownVisible, setIsBreakdownVisible] = useState(false);
    const isAmountProtected = useIsAmountProtected();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const formatPercent = useFormatPercent();

    const handleToggleBreakdown = () => void setIsBreakdownVisible(current => !current);

    const barSegments = isDefined(other) ? [...segments, other] : segments;
    const total = barSegments.reduce((sum, segment) => sum + segment.amount, 0);
    const formatShare = (amount: number) => (isAmountProtected ? '••%' : formatPercent(getShare(amount, total)));
    const otherShareLabel = isDefined(other) ? formatShare(other.amount) : '';
    const isCaptionVisible = !isAccessibilityTextSize || isBreakdownVisible;
    const breakdownState = { expanded: isBreakdownVisible };
    const breakdownToggleLabel = isBreakdownVisible ? t`Hide breakdown` : t`Show breakdown`;

    return (
        <View className="gap-y-lg">
            {isAmountProtected ? (
                <View className="h-[12px] rounded-full bg-surface-fill" />
            ) : (
                <View
                    className="h-[12px] flex-row gap-x-[2px] overflow-hidden rounded-full"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                >
                    {barSegments.map(segment => {
                        const segmentStyle = { flexGrow: segment.amount, flexBasis: 0 };

                        return (
                            <Animated.View
                                key={segment.key}
                                layout={SEGMENT_TRANSITION}
                                className={cn('h-full min-w-[3px]', segment.swatchClassName)}
                                style={segmentStyle}
                            />
                        );
                    })}
                </View>
            )}

            {isAccessibilityTextSize ? (
                <HapticPressable
                    accessibilityRole="button"
                    accessibilityState={breakdownState}
                    className="min-h-[44px] justify-center active:scale-100 active:opacity-60"
                    hitSlop={0}
                    onPress={handleToggleBreakdown}
                >
                    <Text className="text-[15px] text-default-foreground">{breakdownToggleLabel}</Text>
                </HapticPressable>
            ) : null}

            {isCaptionVisible ? (
                <View className="flex-row flex-wrap items-center gap-x-lg gap-y-sm">
                    {segments.slice(0, CAPTION_SEGMENT_COUNT).map(segment => (
                        <StatisticsShareCaptionItem
                            key={segment.key}
                            label={segment.label}
                            shareLabel={formatShare(segment.amount)}
                            swatchClassName={segment.swatchClassName}
                        />
                    ))}

                    {isDefined(other) ? (
                        <HapticPressable
                            accessibilityRole="button"
                            accessibilityHint={t`Shows every category`}
                            className="max-w-full active:scale-100 active:opacity-60"
                            hitSlop={8}
                            onPress={onOtherPress}
                        >
                            <StatisticsShareCaptionItem
                                label={other.label}
                                shareLabel={otherShareLabel}
                                swatchClassName={other.swatchClassName}
                            />
                        </HapticPressable>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
};
