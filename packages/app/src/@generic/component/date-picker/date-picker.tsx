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
        className={cn('text-primary', !day.isCurrentMonth && 'text-secondary-foreground', day.isSelected && 'text-primary-reverse')}
    >
        {day.text}
    </Text>
);

const defaultComponents: CalendarComponents = {
    IconNext: <Icon icon={UserIconNameEnum.ChevronRight} className="text-primary" size={24} />,
    IconPrev: <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={24} />,
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
        month: '',
        month_label: 'text-primary text-sm font-medium',
        selected_month: 'bg-primary rounded-full',
        selected_month_label: 'text-primary-reverse',
        day: '',
        day_cell: 'overflow-hidden',
        day_label: 'text-primary',
        today: 'border border-primary rounded-full',
        today_label: 'text-primary font-semibold',
        year: '',
        year_label: 'text-primary text-sm font-medium',
        selected_year: 'bg-primary rounded-full',
        selected_year_label: 'text-primary-reverse',
        year_selector_label: 'text-secondary-foreground text-sm font-medium',
        month_selector_label: 'text-primary text-lg font-semibold',
        selected: 'bg-primary rounded-full',
        selected_label: 'text-primary-reverse',
        range_fill: 'bg-ghost-background',
        range_middle_label: 'text-primary',
        range_start: 'bg-primary rounded-l-full',
        range_start_label: 'text-primary-reverse',
        range_end: 'bg-primary rounded-r-full',
        range_end_label: 'text-primary-reverse',
        weekday: '',
        weekday_label: 'text-xs text-secondary-foreground font-semibold uppercase tracking-wider'
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return <DateTimePicker {...props} classNames={classNames} locale={languageTag} components={mergedComponents} />;
};
