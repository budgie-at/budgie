import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { AnalyticsTabType } from '../../type/analytics-tab.type';
import { AnalyticsSegmentedControlItem } from '../analytics-segmented-control-item/analytics-segmented-control-item';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly onChangeTab: (tab: AnalyticsTabType) => void;
}

const TRACK_PADDING = 2;
const THUMB_SPRING = { damping: 30, stiffness: 420, mass: 0.8 };
const continuousCorners = { borderCurve: 'continuous' as const };

export const AnalyticsSegmentedControl = ({ activeTab, onChangeTab }: Props) => {
    const { t } = useLingui();
    const reducedMotion = useReducedMotion();
    const [segmentWidth, setSegmentWidth] = useState(0);

    const segments = [
        { key: 'categories' as const, label: t`Categories`, testID: AnalyticsPageSelector.CategoriesTab },
        { key: 'tags' as const, label: t`Tags`, testID: AnalyticsPageSelector.TagsTab },
        { key: 'runway' as const, label: t`Runway`, testID: AnalyticsPageSelector.RunwayTab }
    ];
    const activeIndex = Math.max(
        segments.findIndex(segment => segment.key === activeTab),
        0
    );
    const thumbOffset = useSharedValue(activeIndex * segmentWidth);

    const thumbAnimatedStyle = useAnimatedStyle(() => ({ width: segmentWidth, transform: [{ translateX: thumbOffset.get() }] }));

    const handleLayout = (event: LayoutChangeEvent) =>
        void setSegmentWidth((event.nativeEvent.layout.width - TRACK_PADDING * 2) / segments.length);

    const thumbStyle = [continuousCorners, thumbAnimatedStyle];

    useEffect(() => {
        const target = activeIndex * segmentWidth;

        thumbOffset.set(reducedMotion ? target : withSpring(target, THUMB_SPRING));
    }, [activeIndex, reducedMotion, segmentWidth, thumbOffset]);

    return (
        <View
            accessibilityRole="tablist"
            className="min-h-[36px] flex-row rounded-[10px] bg-surface-fill p-[2px]"
            style={continuousCorners}
            onLayout={handleLayout}
        >
            <Animated.View
                className="absolute top-[2px] bottom-[2px] left-[2px] rounded-[8px] bg-white shadow-sm dark:bg-[rgb(99,99,102)]"
                style={thumbStyle}
            />

            {segments.map(segment => (
                <AnalyticsSegmentedControlItem
                    key={segment.key}
                    tab={segment.key}
                    label={segment.label}
                    isActive={segment.key === activeTab}
                    testID={segment.testID}
                    onPress={onChangeTab}
                />
            ))}
        </View>
    );
};
