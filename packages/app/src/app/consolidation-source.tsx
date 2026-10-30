import { Stack } from 'expo-router';
import { View } from 'react-native';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { ConsolidationSourceModalContent } from '../transaction/components/consolidation-source-modal-content/consolidation-source-modal-content';
import { useConsolidationSourceModal, useConsolidationSourceModalParams } from '../transaction/context/consolidation-source-modal.context';

export default function ConsolidationSourceModal() {
    const [, resolveConsolidationSource, dismissConsolidationSource] = useConsolidationSourceModal();
    const currentParams = useConsolidationSourceModalParams();
    const screenOptions = useModalRouteState(currentParams, dismissConsolidationSource);

    const handleClose = () => {
        resolveConsolidationSource(null);
    };

    if (!currentParams) {
        return null;
    }

    return (
        <View className="bg-grouped-surface" collapsable={false}>
            <Stack.Screen options={screenOptions} />
            <ConsolidationSourceModalContent
                transactionId={currentParams.transactionId}
                onClose={handleClose}
                onRevertSuccess={handleClose}
            />
        </View>
    );
}
