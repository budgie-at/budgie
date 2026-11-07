import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { SingleDatePicker } from '../@generic/component/date-picker/single-date-picker';
import { SheetHeaderAction } from '../@generic/component/sheet-header-action/sheet-header-action';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { SheetTitleRow } from '../@generic/component/sheet-title-row/sheet-title-row';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useToday } from '../@generic/hook/use-today.hook';
import { useDatePickerModal, useDatePickerModalParams } from '../transaction/context/date-picker-modal.context';

import { DatePickerModalSelector } from './date-picker-modal.selector';

export default function DatePickerModal() {
    const { t } = useLingui();
    const [, resolveDatePicker, dismissDatePicker] = useDatePickerModal();
    useModalDismiss(dismissDatePicker);
    const currentParams = useDatePickerModalParams();
    const today = useToday();
    const [selectedDate, setSelectedDate] = useState(currentParams?.initialDate ?? today);
    const handleDone = () => void resolveDatePicker(selectedDate);
    const handleClose = () => void resolveDatePicker(null);

    return (
        <View collapsable={false}>
            <SheetSurface
                className="flex-none"
                contentClassName="flex-none"
                header={
                    <SheetTitleRow
                        title={t`Date`}
                        onClose={handleClose}
                        trailing={<SheetHeaderAction label={t`Done`} onPress={handleDone} testID={DatePickerModalSelector.Done} />}
                    />
                }
            >
                <View className="pb-safe-or-[48px]">
                    <SingleDatePicker date={selectedDate} onChange={setSelectedDate} />
                </View>
            </SheetSurface>
        </View>
    );
}
