import { UserIconNameEnum } from '@budgie/contracts';
import { ComponentProps, useMemo } from 'react';
import { Text, TextStyle, ViewStyle } from 'react-native';
import DateTimePicker, { CalendarComponents, CalendarDay, useDefaultClassNames } from 'react-native-ui-datepicker';

import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { useThemeContext } from '../../../theme/context/theme.context';
import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

import { DatePickerSelector as DatePickerSelectors } from './date-picker.selector';

const renderDay = (day: CalendarDay) => (
    <Text
        testID={DatePickerSelectors.Day(day.number)}
        className={cn(
            'text-primary font-medium',
            !day.isCurrentMonth && 'text-secondary-foreground/40',
            day.isToday && 'font-bold',
            (day.isSelected || day.rangeStart || day.rangeEnd) && 'text-primary-reverse font-bold'
        )}
    >
        {day.text}
    </Text>
);

const defaultComponents: CalendarComponents = {
    IconNext: <Icon icon={UserIconNameEnum.ChevronRight} className="text-primary" size={20} />,
    IconPrev: <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={20} />,
    Day: renderDay
};

const DAY_PILL_RADIUS = 9999;
const TODAY_BORDER_WIDTH = 1;

const buildStyles = (isDark: boolean) => {
    const primary = isDark ? '#ffffff' : '#000000';
    const rangeFill = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const pill: ViewStyle = { backgroundColor: primary, borderRadius: DAY_PILL_RADIUS };
    const todayRing: ViewStyle = { borderRadius: DAY_PILL_RADIUS, borderWidth: TODAY_BORDER_WIDTH, borderColor: primary };
    const rangeFillStyle: ViewStyle = { backgroundColor: rangeFill };
    const rangeFillStart: ViewStyle = {
        backgroundColor: rangeFill,
        borderTopLeftRadius: DAY_PILL_RADIUS,
        borderBottomLeftRadius: DAY_PILL_RADIUS
    };
    const rangeFillEnd: ViewStyle = {
        backgroundColor: rangeFill,
        borderTopRightRadius: DAY_PILL_RADIUS,
        borderBottomRightRadius: DAY_PILL_RADIUS
    };
    const transparentText: TextStyle = { backgroundColor: 'transparent' };

    return {
        today: todayRing,
        selected: pill,
        range_start: pill,
        range_end: pill,
        range_middle: transparentText,
        range_fill: rangeFillStyle,
        range_fill_weekstart: rangeFillStart,
        range_fill_weekend: rangeFillEnd
    };
};

export const DatePicker = (props: ComponentProps<typeof DateTimePicker>) => {
    const { languageTag } = useLocaleInfo();
    const { isDarkColorSchema } = useThemeContext();
    const defaultClassNames = useDefaultClassNames();
    const mergedComponents = { ...defaultComponents, ...props.components };
    const themedStyles = useMemo(() => buildStyles(isDarkColorSchema), [isDarkColorSchema]);

    /* eslint-disable lingui/no-unlocalized-strings */
    const classNames = {
        ...defaultClassNames,
        header: 'py-md px-xl',
        weekdays: 'border-b-0',
        weekday_label: 'text-xxs text-secondary-foreground font-semibold uppercase tracking-widest',
        day_cell: '',
        day: '',
        day_label: 'text-primary',
        outside: '',
        outside_label: 'text-secondary-foreground/40',
        month: '',
        month_label: 'text-primary text-sm font-medium',
        selected_month: 'bg-primary rounded-full',
        selected_month_label: 'text-primary-reverse font-semibold',
        year: '',
        year_label: 'text-primary text-sm font-medium',
        selected_year: 'bg-primary rounded-full',
        selected_year_label: 'text-primary-reverse font-semibold',
        year_selector_label: 'text-secondary-foreground text-sm font-medium',
        month_selector_label: 'text-primary text-lg font-semibold',
        disabled_label: 'text-secondary-foreground/30'
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return <DateTimePicker {...props} classNames={classNames} styles={themedStyles} locale={languageTag} components={mergedComponents} />;
};
