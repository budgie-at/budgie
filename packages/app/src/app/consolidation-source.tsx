import { router } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../@generic/constant/morphing-sheet-height-ratio.constant';
import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useMorphingSheetListHeight } from '../@generic/hook/use-morphing-sheet-list-height.hook';
import { ConsolidationSourceModalContent } from '../transaction/components/consolidation-source-modal-content/consolidation-source-modal-content';
import { useConsolidationSourceModal, useConsolidationSourceModalParams } from '../transaction/context/consolidation-source-modal.context';

export default function ConsolidationSourceModal() {
    const [, , dismissConsolidationSource] = useConsolidationSourceModal();
    const currentParams = useConsolidationSourceModalParams();
    useModalRouteState(currentParams, dismissConsolidationSource);
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <SingleStepMorphingSheet onDismiss={router.back}>
            <View style={listStyle}>
                <ConsolidationSourceModalContent transactionId={currentParams.transactionId} />
            </View>
        </SingleStepMorphingSheet>
    );
}
