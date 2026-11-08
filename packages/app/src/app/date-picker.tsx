import { DatePickerSheetContent } from '../@generic/component/date-picker-sheet-content/date-picker-sheet-content';
import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { useToday } from '../@generic/hook/use-today.hook';
import { useDatePickerModal, useDatePickerModalParams } from '../transaction/context/date-picker-modal.context';

export default function DatePickerModal() {
    const [, resolveDatePicker, dismissDatePicker] = useDatePickerModal();
    useModalDismiss(dismissDatePicker);
    const currentParams = useDatePickerModalParams();
    const today = useToday();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<Date>(resolveDatePicker);
    const initialDate = currentParams?.initialDate ?? today;

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <DatePickerSheetContent initialDate={initialDate} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
