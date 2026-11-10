import { router } from 'expo-router';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { ResyncWindowPickerModalContent } from '../sync/component/resync-window-picker-modal-content/resync-window-picker-modal-content';

export default function ResyncWindowPickerModal() {
    const { params: modalParams } = useModalRoute('/resync-window-picker');
    const accountId = modalParams?.accountId ?? 0;

    return (
        <SingleStepMorphingSheet onDismiss={router.back}>
            <ResyncWindowPickerModalContent accountId={accountId} />
        </SingleStepMorphingSheet>
    );
}
