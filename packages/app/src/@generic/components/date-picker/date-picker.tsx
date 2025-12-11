import DateTimePicker, { CalendarComponents, DateType, useDefaultClassNames } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { ICONS } from '../../constant/icons.constant';
import { Icon } from '../icon/icon';
import { DatePickerRangeProps, DatePickerSingleProps } from 'react-native-ui-datepicker/lib/typescript/datetime-picker';

const components: CalendarComponents = {
    IconNext: <Icon icon={ICONS.ChevronRight} className="text-primary" size={24} />,
    IconPrev: <Icon icon={ICONS.ChevronLeft} className="text-primary" size={24} />
};

export const DatePicker = ({ date, onChange, mode, startDate, endDate }: DatePickerSingleProps | DatePickerRangeProps) => {
    const { settings } = useSettingsContext();
    const defaultClassNames = useDefaultClassNames();

    const handleDateChange = ({ date }: { date: DateType }) => {
        if (isDefined(date)) {
            void onChange(new Date(date.toString()));
        }
    };

    /* eslint-disable lingui/no-unlocalized-strings */
    const classNames = {
        ...defaultClassNames,
        today: 'bg-primary/10',
        today_label: 'text-primary',
        header: 'py-xl px-xl',
        month: 'bg-primary-reverse',
        month_label: 'text-primary text-sm font-medium',
        selected_month: 'bg-primary rounded-full',
        selected_month_label: 'text-primary-reverse',
        day: 'text-white',
        year: 'bg-primary-reverse',
        year_label: 'text-primary text-sm font-medium',
        selected_year: 'bg-primary rounded-full',
        selected_year_label: 'text-primary-reverse',
        year_selector_label: 'text-secondary-foreground text-sm font-medium',
        month_selector_label: 'text-primary text-lg font-semibold',
        day_label: 'text-primary',
        // day_cell: 'bg-primary-reverse rounded-full overflow-hidden',
        day_cell: 'bg-primary-reverse overflow-hidden',
        selected: 'bg-primary',
        selected_label: 'text-primary-reverse',
        range_middle: 'bg-secondary-corner',
        range_middle_label: 'text-primary',
        range_start: 'rounded-l-full',
        range_end: 'rounded-r-full',
        weekday: 'bg-primary-reverse',
        weekday_label: 'text-xs text-secondary-foreground font-semibold'
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <DateTimePicker
            classNames={classNames}
            locale={settings.locale}
            date={date}
            startDate={startDate}
            endDate={endDate}
            components={components}
            onChange={onChange}
            mode={mode}
        />
    );
};
