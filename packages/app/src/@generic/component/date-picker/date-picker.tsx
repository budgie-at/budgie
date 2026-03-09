import { UserIconNameEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';
import DateTimePicker, { CalendarComponents, useDefaultClassNames } from 'react-native-ui-datepicker';

import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { Icon } from '../icon/icon';

const defaultComponents: CalendarComponents = {
    IconNext: <Icon icon={UserIconNameEnum.ChevronRight} className="text-primary" size={24} />,
    IconPrev: <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={24} />
};

export const DatePicker = (props: ComponentProps<typeof DateTimePicker>) => {
    const { languageTag } = useLocaleInfo();
    const defaultClassNames = useDefaultClassNames();
    const mergedComponents = { ...defaultComponents, ...props.components };

    /* eslint-disable lingui/no-unlocalized-strings */
    const classNames = {
        ...defaultClassNames,
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
        range_start_label: 'text-primary-reverse',
        range_end: 'rounded-r-full',
        range_end_label: 'text-primary-reverse',
        weekday: 'bg-primary-reverse',
        weekday_label: 'text-xs text-secondary-foreground font-semibold'
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return <DateTimePicker {...props} classNames={classNames} locale={languageTag} components={mergedComponents} />;
};
