import { CalendarDay } from 'react-native-ui-datepicker';

import { emptyFn } from '@rnw-community/shared';

import { DatePicker } from '../../../@generic/component/date-picker/date-picker';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { RecurringCalendarDay } from '../recurring-calendar-day/recurring-calendar-day';

interface Props {
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
}

export const RecurringCalendarGrid = ({ entriesByDay, selectedDay, onSelectDay }: Props) => {
    const renderDay = (day: CalendarDay) => (
        <RecurringCalendarDay day={day} entriesByDay={entriesByDay} selectedDay={selectedDay} onSelectDay={onSelectDay} />
    );

    const components = { Day: renderDay };

    return <DatePicker mode="single" onChange={emptyFn} hideHeader components={components} />;
};
