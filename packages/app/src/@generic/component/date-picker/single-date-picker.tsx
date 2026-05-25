import DateTimePicker, { DateTimePickerChangeEvent } from '@expo/ui/community/datetime-picker';
import { StyleSheet } from 'react-native';

import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { useThemeContext } from '../../../theme/context/theme.context';

interface Props {
    readonly date: Date | null;
    readonly onChange: (value: Date) => void;
}

const styles = StyleSheet.create({
    picker: {
        width: '100%'
    }
});

export const SingleDatePicker = ({ date, onChange }: Props) => {
    const { languageTag } = useLocaleInfo();
    const { isDarkColorSchema } = useThemeContext();
    const themeVariant = isDarkColorSchema ? 'dark' : 'light';
    const value = date ?? new Date();

    const handleChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
        onChange(selectedDate);
    };

    return (
        <DateTimePicker
            value={value}
            mode="date"
            display="inline"
            presentation="inline"
            locale={languageTag}
            themeVariant={themeVariant}
            onValueChange={handleChange}
            style={styles.picker}
        />
    );
};
