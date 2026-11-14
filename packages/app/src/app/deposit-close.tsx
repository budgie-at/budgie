import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { DepositCloseSheetContent } from '../account/component/deposit-close-sheet-content/deposit-close-sheet-content';

export default function DepositCloseModal() {
    const { params: modalParams } = useModalRoute('/deposit-close');

    if (!isDefined(modalParams)) {
        return null;
    }

    return (
        <SingleStepMorphingSheet onDismiss={router.back}>
            <DepositCloseSheetContent
                depositAccountId={modalParams.depositAccountId}
                destinationAccountId={modalParams.destinationAccountId}
            />
        </SingleStepMorphingSheet>
    );
}
