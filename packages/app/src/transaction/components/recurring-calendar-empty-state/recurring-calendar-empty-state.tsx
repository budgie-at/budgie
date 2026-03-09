import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { RecurringCalendarEmptyStateDay } from '../recurring-calendar-empty-state-day/recurring-calendar-empty-state-day';
import { RecurringCalendarEmptyStateHint } from '../recurring-calendar-empty-state-hint/recurring-calendar-empty-state-hint';

const HIGHLIGHTED_DAYS = [5, 9, 15, 24];
const TOTAL_DAYS = 28;
const DAYS_PER_ROW = 7;
const ROW_COUNT = TOTAL_DAYS / DAYS_PER_ROW;

const GRID_BASE_DELAY = 300;
const DOT_STAGGER = 200;
const TITLE_DELAY = 1300;
const HINT_BASE_DELAY = 1600;
const HINT_STAGGER = 100;
const ANIMATION_DURATION = 350;

const HIGHLIGHT_DELAYS = new Map(HIGHLIGHTED_DAYS.map((day, index) => [day, GRID_BASE_DELAY + index * DOT_STAGGER]));

export const RecurringCalendarEmptyState = () => {
    const { t } = useLingui();

    const hints = [
        { icon: UserIconNameEnum.Repeat2, label: t`Subscriptions` },
        { icon: UserIconNameEnum.CalendarCheck, label: t`Billing Dates` },
        { icon: UserIconNameEnum.ChartColumn, label: t`Monthly Costs` }
    ];

    return (
        <View className="items-center pt-7xl gap-y-7xl">
            <Animated.View entering={FadeIn.duration(ANIMATION_DURATION)}>
                <CircleIcon icon={UserIconNameEnum.CalendarSearch} size={64} iconSize={32} variant="ghost" className="rounded-5xl" />
            </Animated.View>

            <View className="gap-y-md self-stretch px-3xl">
                {Array.from({ length: ROW_COUNT }, (_, rowIndex) => (
                    <View key={rowIndex} className="flex-row justify-around">
                        {Array.from({ length: DAYS_PER_ROW }, (_, colIndex) => {
                            const day = rowIndex * DAYS_PER_ROW + colIndex + 1;
                            const highlightDelay = HIGHLIGHT_DELAYS.get(day);

                            return (
                                <RecurringCalendarEmptyStateDay
                                    key={day}
                                    day={day}
                                    highlightDelay={highlightDelay}
                                    animationDuration={ANIMATION_DURATION}
                                />
                            );
                        })}
                    </View>
                ))}
            </View>

            <Animated.View entering={FadeInUp.delay(TITLE_DELAY).duration(ANIMATION_DURATION)} className="items-center gap-y-md">
                <Text className="text-secondary-foreground text-md font-medium">
                    <Trans>No recurring payments detected</Trans>
                </Text>
                <Text className="text-secondary-foreground/60 text-xs text-center max-w-[280px]">
                    <Trans>Recurring payments will appear here once patterns are detected from your transactions</Trans>
                </Text>
            </Animated.View>

            <View className="flex-row gap-x-5xl">
                {hints.map((hint, index) => {
                    const hintDelay = HINT_BASE_DELAY + index * HINT_STAGGER;

                    return (
                        <RecurringCalendarEmptyStateHint
                            key={hint.label}
                            icon={hint.icon}
                            label={hint.label}
                            delay={hintDelay}
                            animationDuration={ANIMATION_DURATION}
                        />
                    );
                })}
            </View>
        </View>
    );
};
