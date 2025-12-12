import { ComponentProps } from 'react';
import DateTimePicker, { CalendarComponents, useDefaultClassNames } from 'react-native-ui-datepicker';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { ICONS } from '../../constant/icons.constant';
import { Icon } from '../icon/icon';

const components: CalendarComponents = {
    IconNext: <Icon icon={ICONS.ChevronRight} className="text-primary" size={24} />,
    IconPrev: <Icon icon={ICONS.ChevronLeft} className="text-primary" size={24} />
};

export const DatePicker = ({ classNames, ...props }: ComponentProps<typeof DateTimePicker>) => {
    const { settings } = useSettingsContext();
    const defaultClassNames = useDefaultClassNames();

    /* eslint-disable lingui/no-unlocalized-strings */
    const className = {
        ...defaultClassNames,
        ...classNames,
        today: 'bg-primary/20',
        today_label: 'text-primary',
        header: 'py-xl px-xl',
        month: 'bg-primary-reverse',
        month_label: 'text-primary text-sm font-medium',
        selected_month: 'bg-primary rounded-full',
        selected_month_label: 'text-primary-reverse',
        day: 'text-white rounded-full',
        day_cell: 'bg-primary-reverse overflow-hidden',
        day_label: 'text-primary',
        year: 'bg-primary-reverse',
        year_label: 'text-primary text-sm font-medium',
        selected_year: 'bg-primary rounded-full',
        selected_year_label: 'text-primary-reverse',
        year_selector_label: 'text-secondary-foreground text-sm font-medium',
        month_selector_label: 'text-primary text-lg font-semibold',
        selected: 'bg-primary',
        selected_label: 'text-primary-reverse',
        range_fill: 'bg-secondary-corner',
        range_middle_label: 'text-primary',
        range_start: 'rounded-l-full',
        range_end: 'rounded-r-full',
        weekday: 'bg-primary-reverse',
        weekday_label: 'text-xs text-secondary-foreground font-semibold'
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return <DateTimePicker {...props} classNames={className} locale={settings.locale} components={components} />;
};
