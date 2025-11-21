import { styled } from 'nativewind';
import { Text, View } from 'react-native';
import DateTimePicker, { DateType } from 'react-native-ui-datepicker';
import { CalendarComponents } from 'react-native-ui-datepicker/src/types';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { ICONS } from '../../constant/icons.constant';
import { Icon } from '../icon/icon';

const components: CalendarComponents = {
    IconNext: <Icon icon={ICONS.ChevronRight} className="text-primary" size={24} />,
    IconPrev: <Icon icon={ICONS.ChevronLeft} className="text-primary" size={24} />,
    Weekday: ({ name }) => <Text className="text-primary">{name.short}</Text>,
    Month: ({ name }) => <Text className="text-primary">{name.full}</Text>,
    Year: ({ text }) => <Text className="text-primary">{text}</Text>,
    Day: ({ text, isSelected }) => (
        <View className={isSelected ? 'bg-primary w-full h-full items-center justify-center rounded-full' : ''}>
            <Text className={isSelected ? 'text-sm text-primary-reverse' : 'text-sm text-primary font-medium'}>{text}</Text>
        </View>
    )
};

interface Props {
    readonly date: DateType;
    readonly onChange: (date: DateType) => void;
}

const Picker = styled(DateTimePicker, {
    month_selector_label_className: 'styles.month_selector_label',
    year_selector_label_className: 'styles.year_selector_label'
});

export const DatePicker = ({ date, onChange }: Props) => {
    const { settings } = useSettingsContext();

    const handleDateChange = ({ date }: { date: DateType }) => void onChange(date);

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
