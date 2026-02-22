import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

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
    const { data, isLoading } = useRecurringCalendar();
    const [selectedDay, setSelectedDay] = useState<number | undefined>();

    const entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]> = data?.entriesByDay ?? new Map();
    const selectedEntries = isDefined(selectedDay) ? entriesByDay.get(selectedDay) : null;

    if (isLoading) {
        return (
            <Page header={<PageHeader className="border-b-0" size="md" title={t`Recurring Payments`} />}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                </View>
            </Page>
        );
    }

    const hasEntries = isDefined(data) && data.entriesByDay.size > 0;

    return (
        <Page header={<PageHeader className="border-b-0" size="md" title={t`Recurring Payments`} />}>
            {hasEntries ? (
                <View className="flex-1">
                    <View className="gap-y-xl px-5xl pt-xl">
                        <View className="flex-row">
                            <RecurringCalendarSummary totalAmount={data.totalAmount} />
                        </View>

                        <RecurringCalendarGrid entriesByDay={entriesByDay} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
                    </View>

                    {isDefined(selectedEntries) && isDefined(selectedDay) ? (
                        <ScrollView className="flex-1" contentContainerClassName="px-5xl pb-5xl pt-lg" showsVerticalScrollIndicator={false}>
                            <RecurringCalendarDayDetail day={selectedDay} entries={selectedEntries} />
                            <MenuSpacer />
                        </ScrollView>
                    ) : null}
                </View>
            ) : (
                <ScrollView contentContainerClassName="py-5xl" showsVerticalScrollIndicator={false}>
                    <EmptyState
                        circleIcon={UserIconNameEnum.CalendarSearch}
                        title={t`No recurring payments detected`}
                        description={t`Recurring payments will appear here once patterns are detected from your transactions`}
                    />
                </ScrollView>
            )}
        </Page>
    );
};
