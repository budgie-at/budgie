import { UserIconNameEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';
import { Text } from 'react-native';
import DateTimePicker, { CalendarComponents, CalendarDay, useDefaultClassNames } from 'react-native-ui-datepicker';

import { DatePickerSelectors } from '../../../@e2e/selectors/date-picker.selector';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

const renderDay = (day: CalendarDay) => (
    <Text
        testID={DatePickerSelectors.Day(day.number)}
        className={cn('text-primary', !day.isCurrentMonth && 'text-secondary-foreground/50', day.isSelected && 'text-primary-reverse')}
    >
        {day.text}
    </Text>
);

const defaultComponents: CalendarComponents = {
    IconNext: <Icon icon={UserIconNameEnum.ChevronRight} className="text-primary" size={20} />,
    IconPrev: <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={20} />,
    Day: renderDay
};

export const DatePicker = (props: ComponentProps<typeof DateTimePicker>) => {
    const { languageTag } = useLocaleInfo();
    const defaultClassNames = useDefaultClassNames();
    const mergedComponents = { ...defaultComponents, ...props.components };

    /* eslint-disable lingui/no-unlocalized-strings */
    const classNames = {
        ...defaultClassNames,
        header: 'py-md px-xl',
        weekdays: 'bg-transparent border-b-0',
        weekday: 'bg-transparent',
        weekday_label: 'text-xxs text-secondary-foreground font-semibold uppercase tracking-widest',
        day_cell: 'bg-transparent',
        day: 'bg-transparent rounded-full',
        day_label: 'text-primary',
        outside: 'bg-transparent',
        outside_label: 'text-secondary-foreground/40',
        today: 'border border-primary/30 rounded-full bg-transparent',
        today_label: 'text-primary font-semibold',
        selected: 'bg-primary rounded-full',
        selected_label: 'text-primary-reverse font-semibold',
        range_fill: 'bg-ghost-background',
        range_fill_weekstart: 'bg-ghost-background rounded-l-full',
        range_fill_weekend: 'bg-ghost-background rounded-r-full',
        range_middle: 'bg-transparent',
        range_middle_label: 'text-primary',
        range_start: 'bg-primary rounded-full',
        range_start_label: 'text-primary-reverse font-semibold',
        range_end: 'bg-primary rounded-full',
        range_end_label: 'text-primary-reverse font-semibold',
        month: 'bg-transparent',
        month_label: 'text-primary text-sm font-medium',
        selected_month: 'bg-primary rounded-full',
        selected_month_label: 'text-primary-reverse',
        year: 'bg-transparent',
        year_label: 'text-primary text-sm font-medium',
        selected_year: 'bg-primary rounded-full',
        selected_year_label: 'text-primary-reverse',
        year_selector_label: 'text-secondary-foreground text-sm font-medium',
        month_selector_label: 'text-primary text-lg font-semibold',
        disabled: 'bg-transparent',
        disabled_label: 'text-secondary-foreground/30'
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return <DateTimePicker {...props} classNames={classNames} locale={languageTag} components={mergedComponents} />;
};
