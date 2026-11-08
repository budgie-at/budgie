import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../@generic/constant/morphing-sheet-height-ratio.constant';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetListHeight } from '../@generic/hook/use-morphing-sheet-list-height.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { ConsolidationSourceModalContent } from '../transaction/components/consolidation-source-modal-content/consolidation-source-modal-content';
import { useConsolidationSourceModal, useConsolidationSourceModalParams } from '../transaction/context/consolidation-source-modal.context';

export default function ConsolidationSourceModal() {
    const [, resolveConsolidationSource, dismissConsolidationSource] = useConsolidationSourceModal();
    useModalDismiss(dismissConsolidationSource);
    const currentParams = useConsolidationSourceModalParams();
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const { handleDismissed } = useMorphingSheetResult(resolveConsolidationSource);

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <View style={listStyle}>
                <ConsolidationSourceModalContent transactionId={currentParams.transactionId} />
            </View>
        </SingleStepMorphingSheet>
    );
}
