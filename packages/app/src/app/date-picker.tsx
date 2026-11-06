import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView } from 'react-native';

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
        <SheetSurface
            header={
                <SheetTitleRow
                    title={t`Date`}
                    onClose={handleClose}
                    trailing={<SheetHeaderAction label={t`Done`} onPress={handleDone} testID={DatePickerModalSelector.Done} />}
                />
            }
        >
            <ScrollView contentContainerClassName="pb-safe-or-[16px]" showsVerticalScrollIndicator={false}>
                <SingleDatePicker date={selectedDate} onChange={setSelectedDate} />
            </ScrollView>
        </SheetSurface>
    );
}
