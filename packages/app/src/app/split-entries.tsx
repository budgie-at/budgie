import { Stack } from 'expo-router';
import { View } from 'react-native';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { SplitEntriesModalContent } from '../transaction/components/split-entries-modal-content/split-entries-modal-content';
import { useSplitEntriesModal, useSplitEntriesModalParams } from '../transaction/context/split-entries-modal.context';

export default function SplitEntriesModal() {
    const [, resolveSplitEntries] = useSplitEntriesModal();
    const currentParams = useSplitEntriesModalParams();
    const screenOptions = useModalRouteState(currentParams, resolveSplitEntries, null);

    if (!currentParams) {
        return null;
    }

    return (
        <View className="flex-1 bg-primary-reverse" collapsable={false}>
            <Stack.Screen options={screenOptions} />
            <SplitEntriesModalContent
                initialEntries={currentParams.entries}
                variant={currentParams.variant}
                entryType={currentParams.entryType}
                currencySymbol={currentParams.currencySymbol}
                totalAmount={currentParams.totalAmount}
                onConfirm={resolveSplitEntries}
            />
        </View>
    );
}
