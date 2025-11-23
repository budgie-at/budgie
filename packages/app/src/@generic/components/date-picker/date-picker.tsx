import { cva } from 'class-variance-authority';
import { styled } from 'nativewind';
import { Text, View } from 'react-native';
import DateTimePicker, { CalendarComponents, DateType } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { ICONS } from '../../constant/icons.constant';
import { Icon } from '../icon/icon';

const dayVariants = cva('', {
    variants: {
        isSelected: {
            true: 'bg-primary w-full h-full items-center justify-center rounded-full',
            false: ''
        }
    }
});

const dayTextVariants = cva('', {
    variants: {
        isSelected: {
            true: 'text-sm text-primary-reverse',
            false: 'text-sm text-primary font-medium'
        }
    }
});

const Day = ({ text, isSelected }: { text: string; isSelected: boolean }) => (
    <View className={dayVariants({ isSelected })}>
        <Text className={dayTextVariants({ isSelected })}>{text}</Text>
    </View>
);

const components: CalendarComponents = {
    IconNext: <Icon icon={ICONS.ChevronRight} className="text-primary" size={24} />,
    IconPrev: <Icon icon={ICONS.ChevronLeft} className="text-primary" size={24} />,
    Weekday: ({ name }) => <Text className="text-primary">{name.short}</Text>,
    Month: ({ name }) => <Text className="text-primary">{name.full}</Text>,
    Year: ({ text }) => <Text className="text-primary">{text}</Text>,
    Day
};

interface Props {
    readonly date: Date;
    readonly onChange: (date: Date) => void;
}

const Picker = styled(DateTimePicker, {
    month_selector_label_className: 'styles.month_selector_label',
    year_selector_label_className: 'styles.year_selector_label'
});

export const DatePicker = ({ date, onChange }: Props) => {
    const { settings } = useSettingsContext();

    const handleDateChange = ({ date }: { date: DateType }) => {
        if (isDefined(date)) {
            void onChange(new Date(date.toString()));
        }
    };

    return (
        <Picker
            month_selector_label_className="text-primary"
            year_selector_label_className="text-primary"
            locale={settings.locale}
            date={date}
            onChange={handleDateChange}
            components={components}
            mode="single"
        />
    );
};
