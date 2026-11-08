import { router } from 'expo-router';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { ResyncWindowPickerModalContent } from '../sync/component/resync-window-picker-modal-content/resync-window-picker-modal-content';
import { useResyncWindowPickerModal, useResyncWindowPickerModalParams } from '../sync/context/resync-window-picker-modal.context';

export default function ResyncWindowPickerModal() {
    const [, , dismissResyncWindowPicker] = useResyncWindowPickerModal();
    useModalDismiss(dismissResyncWindowPicker);
    const accountId = useResyncWindowPickerModalParams()?.accountId ?? 0;

    return (
        <SingleStepMorphingSheet onDismiss={router.back}>
            <ResyncWindowPickerModalContent accountId={accountId} />
        </SingleStepMorphingSheet>
    );
}
