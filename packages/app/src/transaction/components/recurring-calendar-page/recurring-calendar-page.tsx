import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { useRecurringCalendar } from '../../hook/use-recurring-calendar.hook';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { RecurringCalendarDayDetail } from '../recurring-calendar-day-detail/recurring-calendar-day-detail';
import { RecurringCalendarGrid } from '../recurring-calendar-grid/recurring-calendar-grid';
import { RecurringCalendarSummary } from '../recurring-calendar-summary/recurring-calendar-summary';

 
export const RecurringCalendarPage = () => {
    const { t } = useLingui();
    const router = useRouter();
    const { data, isLoading } = useRecurringCalendar();
    const [selectedDay, setSelectedDay] = useState<number | undefined>();

    const entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]> = data?.entriesByDay ?? new Map();
    const selectedEntries = isDefined(selectedDay) ? entriesByDay.get(selectedDay) : void 0;

    const handleGoBack = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <Page header={<PageHeader title={t`Recurring Payments`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                </View>
            </Page>
        );
    }

    const hasEntries = isDefined(data) && data.entriesByDay.size > 0;

    return (
        <Page header={<PageHeader title={t`Recurring Payments`} onGoBack={handleGoBack} />}>
            <ScrollView contentContainerClassName="gap-y-7xl py-5xl" showsVerticalScrollIndicator={false}>
                {hasEntries ? (
                    <>
                        <View className="flex-row">
                            <RecurringCalendarSummary totalAmount={data.totalAmount} />
                        </View>

                        <View className="gap-y-lg">
                            <Text className="uppercase text-secondary-foreground text-xs">
                                <Trans>Calendar</Trans>
                            </Text>

                            <RecurringCalendarGrid
                                entriesByDay={entriesByDay}
                                selectedDay={selectedDay}
                                onSelectDay={setSelectedDay}
                            />
                        </View>

                        {isDefined(selectedEntries) && isDefined(selectedDay) ? (
                            <RecurringCalendarDayDetail day={selectedDay} entries={selectedEntries} />
                        ) : null}
                    </>
                ) : (
                    <EmptyState
                        circleIcon={UserIconNameEnum.CalendarSearch}
                        title={t`No recurring payments detected`}
                        description={t`Recurring payments will appear here once patterns are detected from your transactions`}
                    />
                )}

                <MenuSpacer />
            </ScrollView>
        </Page>
    );
};
