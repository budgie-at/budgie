import { ScrollView, Text, View } from 'react-native';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { RecurringCalendarEntryRows } from '../recurring-calendar-entry-rows/recurring-calendar-entry-rows';

import type { ReactNode } from 'react';

interface Props {
    readonly title: ReactNode;
    readonly formattedTotal: string;
    readonly entries: readonly RecurringCalendarEntryInterface[];
    readonly displayMonth: number;
    readonly displayYear: number;
}

export const RecurringCalendarEntryList = ({ title, formattedTotal, entries, displayMonth, displayYear }: Props) => (
    <View className="flex-1 pt-lg">
        <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
            <Text className="text-xs uppercase text-secondary-foreground">{title}</Text>
            <ProtectedText className="text-xs text-secondary-foreground">{formattedTotal}</ProtectedText>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="pb-5xl" showsVerticalScrollIndicator={false}>
            <RecurringCalendarEntryRows entries={entries} displayMonth={displayMonth} displayYear={displayYear} />
            <MenuSpacer />
        </ScrollView>
    </View>
);
