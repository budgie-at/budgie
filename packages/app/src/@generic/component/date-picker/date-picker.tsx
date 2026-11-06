import { UserIconNameEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';
import { ColorValue, Text, TextStyle, ViewStyle } from 'react-native';
import DateTimePicker, { CalendarComponents, CalendarDay, useDefaultClassNames } from 'react-native-ui-datepicker';
import { useResolveClassNames } from 'uniwind';

import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { cn } from '../../utils/cn.util';
import { DatePickerGridLabel } from '../date-picker-grid-label/date-picker-grid-label';
import { DatePickerHeaderButton } from '../date-picker-header-button/date-picker-header-button';
import { Icon } from '../icon/icon';

import { DatePickerSelector } from './date-picker.selector';

const renderDay = (day: CalendarDay, shouldShowTodayIndicator: boolean) => (
    <Text
        testID={DatePickerSelector.Day(day.number)}
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        adjustsFontSizeToFit
        className={cn(
            'text-[17px] text-primary font-medium',
            !day.isCurrentMonth && 'text-secondary-foreground/40',
            shouldShowTodayIndicator && day.isToday && 'font-bold',
            (day.isSelected || day.rangeStart || day.rangeEnd) && 'text-primary-reverse font-bold'
        )}
    >
        {day.text}
    </Text>
);

const RANGE_FILL_CLASSNAME = 'bg-primary/6 dark:bg-primary/8';
const HEADER_CLASSNAME = 'py-md px-xl';
const DAY_PILL_RADIUS = 9999;
const DAY_PILL_SIZE = 44;
const TODAY_BORDER_WIDTH = 1;

const buildStyles = (
    primary: ColorValue | undefined,
    rangeFill: ColorValue | undefined,
    header: ViewStyle,
    shouldShowTodayIndicator: boolean
) => {
    const compactCircle: ViewStyle = {
        alignSelf: 'center',
        flex: 0,
        height: DAY_PILL_SIZE,
        marginVertical: 'auto',
        width: DAY_PILL_SIZE
    };
    const pill: ViewStyle = { ...compactCircle, backgroundColor: primary, borderRadius: DAY_PILL_RADIUS };
    const todayRing: ViewStyle = {
        ...compactCircle,
        borderRadius: DAY_PILL_RADIUS,
        borderWidth: TODAY_BORDER_WIDTH,
        borderColor: primary
    };
    const transparentView: ViewStyle = { backgroundColor: 'transparent' };
    const rangeFillView: ViewStyle = {
        backgroundColor: rangeFill,
        height: DAY_PILL_SIZE,
        marginVertical: 'auto'
    };
    const transparentText: TextStyle = { backgroundColor: 'transparent' };
    const today = shouldShowTodayIndicator ? todayRing : transparentView;

    return {
        header,
        button_prev: { minHeight: 44, minWidth: 44 },
        button_next: { minHeight: 44, minWidth: 44 },
        today,
        selected: pill,
        range_start: pill,
        range_end: pill,
        range_middle: transparentText,
        range_fill: rangeFillView,
        range_fill_weekstart: rangeFillView,
        range_fill_weekend: rangeFillView
    };
};

export const DatePicker = (props: ComponentProps<typeof DateTimePicker>) => {
    const { languageTag } = useLocaleInfo();
    const { backgroundColor: primary } = useResolveClassNames('bg-primary');
    const { backgroundColor: rangeFill } = useResolveClassNames(RANGE_FILL_CLASSNAME);
    const header = useResolveClassNames(HEADER_CLASSNAME);
    const defaultClassNames = useDefaultClassNames();
    const shouldShowTodayIndicator = props.mode !== 'range';
    const defaultComponents: CalendarComponents = {
        IconNext: <Icon icon={UserIconNameEnum.ChevronRight} className="text-primary" size={20} />,
        IconPrev: <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={20} />,
        Day: day => renderDay(day, shouldShowTodayIndicator),
        Weekday: weekday => (
            <Text className="text-[11px] text-secondary-foreground font-semibold" maxFontSizeMultiplier={1.3} numberOfLines={1}>
                {weekday.name[props.weekdaysFormat ?? 'min']}
            </Text>
        ),
        Month: month => <DatePickerGridLabel isSelected={month.isSelected}>{month.name[props.monthsFormat ?? 'full']}</DatePickerGridLabel>,
        Year: year => <DatePickerGridLabel isSelected={year.isSelected}>{year.text}</DatePickerGridLabel>,
        MonthSelector: month => (
            <DatePickerHeaderButton label={month.text} onPress={month.onPress} disabled={props.disableMonthPicker} testID="btn-month" />
        ),
        YearSelector: year => {
            const label = year.isOpen ? year.yearRange : year.year;

            return <DatePickerHeaderButton label={label} onPress={year.onPress} disabled={props.disableYearPicker} testID="btn-year" />;
        }
    };
    const mergedComponents = { ...defaultComponents, ...props.components };
    const themedStyles = buildStyles(primary, rangeFill, header, shouldShowTodayIndicator);

    /* oxlint-disable lingui/no-unlocalized-strings */
    const classNames = {
        ...defaultClassNames,
        header: '',
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
    /* oxlint-enable lingui/no-unlocalized-strings */

    return (
        <DateTimePicker
            containerHeight={320}
            weekdaysHeight={32}
            {...props}
            classNames={classNames}
            styles={themedStyles}
            locale={languageTag}
            components={mergedComponents}
        />
    );
};
