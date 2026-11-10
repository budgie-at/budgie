import { router } from 'expo-router';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { BankIntegrationKeyModalContent } from '../sync/component/bank-integration-key-modal-content/bank-integration-key-modal-content';

export default function BankIntegrationKeyModal() {
    const { params: modalParams } = useModalRoute('/bank-integration-key');
    const integrationId = modalParams ?? 0;

    return (
        <SingleStepMorphingSheet onDismiss={router.back}>
            <BankIntegrationKeyModalContent integrationId={integrationId} />
        </SingleStepMorphingSheet>
    );
}
