import { emptyFn } from '@rnw-community/shared';

import { DatePicker } from '../../../@generic/component/date-picker/date-picker';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { RecurringCalendarDay } from '../recurring-calendar-day/recurring-calendar-day';

interface Props {
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
}

const renderDay = (
    day: { number: number; text: string; isCurrentMonth: boolean; isToday: boolean },
    entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>,
    selectedDay: number | undefined,
    onSelectDay: (day: number) => void
) => <RecurringCalendarDay day={day} entriesByDay={entriesByDay} selectedDay={selectedDay} onSelectDay={onSelectDay} />;

export const RecurringCalendarGrid = ({ entriesByDay, selectedDay, onSelectDay }: Props) => {
    const dayRenderer = (day: { number: number; text: string; isCurrentMonth: boolean; isToday: boolean }) =>
        renderDay(day, entriesByDay, selectedDay, onSelectDay);

    const components = { Day: dayRenderer };

    return <DatePicker mode="single" onChange={emptyFn} components={components} />;
};
