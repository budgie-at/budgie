import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { ResyncWindowPickerModalContent } from '../sync/component/resync-window-picker-modal-content/resync-window-picker-modal-content';
import { useResyncWindowPickerModal, useResyncWindowPickerModalParams } from '../sync/context/resync-window-picker-modal.context';

export default function ResyncWindowPickerModal() {
    const [, resolveResyncWindowPicker, dismissResyncWindowPicker] = useResyncWindowPickerModal();
    useModalDismiss(dismissResyncWindowPicker);
    const accountId = useResyncWindowPickerModalParams()?.accountId ?? 0;
    const { handleDismissed } = useMorphingSheetResult<null>(resolveResyncWindowPicker);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <ResyncWindowPickerModalContent accountId={accountId} />
        </SingleStepMorphingSheet>
    );
}
