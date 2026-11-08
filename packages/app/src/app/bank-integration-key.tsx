import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { BankIntegrationKeyModalContent } from '../sync/component/bank-integration-key-modal-content/bank-integration-key-modal-content';
import { useBankIntegrationKeyModal, useBankIntegrationKeyModalParams } from '../sync/context/bank-integration-key-modal.context';

export default function BankIntegrationKeyModal() {
    const [, resolveKeyModal, dismissKeyModal] = useBankIntegrationKeyModal();
    useModalDismiss(dismissKeyModal);
    const integrationId = useBankIntegrationKeyModalParams() ?? 0;
    const { handleDismissed } = useMorphingSheetResult(resolveKeyModal);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed} isContentDraggable={false}>
            <BankIntegrationKeyModalContent integrationId={integrationId} />
        </SingleStepMorphingSheet>
    );
}
