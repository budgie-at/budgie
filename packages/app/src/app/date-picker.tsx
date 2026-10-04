import { View } from 'react-native';

import { SingleDatePicker } from '../@generic/component/date-picker/single-date-picker';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useToday } from '../@generic/hook/use-today.hook';
import { useDatePickerModal, useDatePickerModalParams } from '../transaction/context/date-picker-modal.context';

export default function DatePickerModal() {
    const [, resolveDatePicker] = useDatePickerModal();
    const currentParams = useDatePickerModalParams();
    const { backgroundColor } = useFormsheetListStyles();
    const today = useToday();
    const initialDate = currentParams?.initialDate ?? today;

    const containerStyle = { flex: 1, backgroundColor };

    return (
        <View style={containerStyle} collapsable={false}>
            <SingleDatePicker date={initialDate} onChange={resolveDatePicker} />
        </View>
    );
}
