import { router } from 'expo-router';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { DepositCloseSheetContent } from '../account/component/deposit-close-sheet-content/deposit-close-sheet-content';

export default function DepositCloseModal() {
    const { params: modalParams } = useModalRoute('/deposit-close');
    const depositAccountId = modalParams?.depositAccountId ?? 0;
    const destinationAccountId = modalParams?.destinationAccountId ?? 0;

    return (
        <SingleStepMorphingSheet onDismiss={router.back}>
            <DepositCloseSheetContent depositAccountId={depositAccountId} destinationAccountId={destinationAccountId} />
        </SingleStepMorphingSheet>
    );
}
