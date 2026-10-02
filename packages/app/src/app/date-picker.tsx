import { View } from 'react-native';

import { SingleDatePicker } from '../@generic/component/date-picker/single-date-picker';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useDatePickerModal, useDatePickerModalParams } from '../transaction/context/date-picker-modal.context';

export default function DatePickerModal() {
    const [, resolveDatePicker] = useDatePickerModal();
    const currentParams = useDatePickerModalParams();
    const { backgroundColor } = useFormsheetListStyles();
    const initialDate = currentParams?.initialDate ?? new Date();

    const containerStyle = { flex: 1, backgroundColor };

    return (
        <View style={containerStyle} collapsable={false}>
            <SingleDatePicker date={initialDate} onChange={resolveDatePicker} />
        </View>
    );
}
