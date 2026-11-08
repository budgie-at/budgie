import { router } from 'expo-router';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { BankIntegrationKeyModalContent } from '../sync/component/bank-integration-key-modal-content/bank-integration-key-modal-content';
import { useBankIntegrationKeyModal, useBankIntegrationKeyModalParams } from '../sync/context/bank-integration-key-modal.context';

export default function BankIntegrationKeyModal() {
    const [, , dismissKeyModal] = useBankIntegrationKeyModal();
    useModalDismiss(dismissKeyModal);
    const integrationId = useBankIntegrationKeyModalParams() ?? 0;

    return (
        <SingleStepMorphingSheet onDismiss={router.back}>
            <BankIntegrationKeyModalContent integrationId={integrationId} />
        </SingleStepMorphingSheet>
    );
}
