import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../@generic/constant/morphing-sheet-height-ratio.constant';
import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useMorphingSheetListHeight } from '../@generic/hook/use-morphing-sheet-list-height.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { ConvertToRefundContent } from '../transaction/components/convert-to-refund-content/convert-to-refund-content';
import { useConvertToRefundModal, useConvertToRefundModalParams } from '../transaction/context/convert-to-refund-modal.context';

import { ConvertToRefundModalSelector } from './convert-to-refund-modal.selector';

export default function ConvertToRefundModal() {
    const [, resolveConvertToRefund, dismissConvertToRefund] = useConvertToRefundModal();
    const currentParams = useConvertToRefundModalParams();
    useModalRouteState(currentParams, dismissConvertToRefund);
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_DESTINATION_HEIGHT_RATIO);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveConvertToRefund);
    const refundIncomeTransactionId = currentParams?.refundIncomeTransactionId ?? 0;

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <View style={listStyle} testID={ConvertToRefundModalSelector.Page}>
                <ConvertToRefundContent refundIncomeTransactionId={refundIncomeTransactionId} onCommit={handleCommit} />
            </View>
        </SingleStepMorphingSheet>
    );
}
