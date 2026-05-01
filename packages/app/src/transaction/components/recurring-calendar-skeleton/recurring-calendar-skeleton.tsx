import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { SkeletonBlock } from '../../../@generic/component/skeleton-block/skeleton-block';

const CALENDAR_ROWS = 6;
const CALENDAR_COLUMNS = 7;
const UPCOMING_ROWS = 2;

const calendarCells = Array.from({ length: CALENDAR_ROWS * CALENDAR_COLUMNS }, (_, index) => index);
const upcomingRows = Array.from({ length: UPCOMING_ROWS }, (_, index) => index);

export const RecurringCalendarSkeleton = () => (
    <View className="flex-1 gap-y-xl pt-md">
        <View className="items-center gap-y-lg">
            <SkeletonBlock className="h-9 w-32" />
            <Text className="font-medium text-xs uppercase text-secondary-foreground">
                <Trans>Monthly Total</Trans>
            </Text>
        </View>

        <View className="gap-y-sm">
            <View className="flex-row items-center justify-between px-sm">
                <SkeletonBlock className="h-5 w-5 rounded-full" />
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-5 w-5 rounded-full" />
            </View>

            <View className="flex-row gap-x-xs justify-around">
                {Array.from({ length: CALENDAR_COLUMNS }, (_, index) => (
                    <SkeletonBlock key={`weekday-${index}`} className="h-3 w-6" />
                ))}
            </View>

            <View className="gap-y-sm">
                {Array.from({ length: CALENDAR_ROWS }, (_, rowIndex) => (
                    <View key={`row-${rowIndex}`} className="flex-row gap-x-xs justify-around">
                        {calendarCells.slice(rowIndex * CALENDAR_COLUMNS, (rowIndex + 1) * CALENDAR_COLUMNS).map(cell => (
                            <SkeletonBlock key={`cell-${cell}`} className="h-10 w-10 rounded-full" />
                        ))}
                    </View>
                ))}
            </View>
        </View>

        <View className="gap-y-md pt-lg">
            <View className="flex-row justify-between">
                <Text className="text-xs uppercase text-secondary-foreground">
                    <Trans>Upcoming</Trans>
                </Text>
                <SkeletonBlock className="h-3 w-16" />
            </View>

            {upcomingRows.map(row => (
                <View key={`upcoming-${row}`} className="flex-row items-center gap-x-md py-md">
                    <SkeletonBlock className="h-8 w-8 rounded-full" />
                    <View className="flex-1 gap-y-xs">
                        <SkeletonBlock className="h-4 w-1/2" />
                        <SkeletonBlock className="h-3 w-1/3" />
                    </View>
                    <SkeletonBlock className="h-4 w-16" />
                </View>
            ))}
        </View>
    </View>
);
