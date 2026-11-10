import { DatePickerSheetContent } from '../@generic/component/date-picker-sheet-content/date-picker-sheet-content';
import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { useToday } from '../@generic/hook/use-today.hook';

export default function DatePickerModal() {
    const { params: currentParams, resolve: resolveDatePicker } = useModalRoute('/date-picker');
    const today = useToday();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<Date>(resolveDatePicker);
    const initialDate = currentParams?.initialDate ?? today;

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <DatePickerSheetContent initialDate={initialDate} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
