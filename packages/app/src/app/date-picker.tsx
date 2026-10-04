import { View } from 'react-native';

import { SingleDatePicker } from '../@generic/component/date-picker/single-date-picker';
import { useDatePickerModal, useDatePickerModalParams } from '../transaction/context/date-picker-modal.context';

export default function DatePickerModal() {
    const [, resolveDatePicker] = useDatePickerModal();
    const currentParams = useDatePickerModalParams();
    const initialDate = currentParams?.initialDate ?? new Date();

    return (
        <View className="flex-1 bg-primary-reverse" collapsable={false}>
            <SingleDatePicker date={initialDate} onChange={resolveDatePicker} />
        </View>
    );
}
