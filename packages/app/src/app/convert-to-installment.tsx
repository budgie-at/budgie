import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { ConvertToInstallmentContent } from '../installment-plan/component/convert-to-installment-content/convert-to-installment-content';
import {
    useConvertToInstallmentModal,
    useConvertToInstallmentModalParams
} from '../installment-plan/context/convert-to-installment-modal.context';

import { ConvertToInstallmentModalSelector } from './convert-to-installment-modal.selector';

export default function ConvertToInstallmentModal() {
    const [, resolveConvertToInstallment, dismissConvertToInstallment] = useConvertToInstallmentModal();
    const currentParams = useConvertToInstallmentModalParams();
    useModalRouteState(currentParams, dismissConvertToInstallment);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveConvertToInstallment);

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <View testID={ConvertToInstallmentModalSelector.Page}>
                <ConvertToInstallmentContent params={currentParams} onCommit={handleCommit} />
            </View>
        </SingleStepMorphingSheet>
    );
}
