import { View } from 'react-native';

import { SingleDatePicker } from '../@generic/component/date-picker/single-date-picker';
import { useToday } from '../@generic/hook/use-today.hook';
import { useDatePickerModal, useDatePickerModalParams } from '../transaction/context/date-picker-modal.context';

export default function DatePickerModal() {
    const [, resolveDatePicker] = useDatePickerModal();
    const currentParams = useDatePickerModalParams();
    const today = useToday();
    const initialDate = currentParams?.initialDate ?? today;

    return (
        <View className="flex-1 bg-primary-reverse" collapsable={false}>
            <SingleDatePicker date={initialDate} onChange={resolveDatePicker} />
        </View>
    );
}
