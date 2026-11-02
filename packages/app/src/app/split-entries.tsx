import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { SplitEntriesModalContent } from '../transaction/components/split-entries-modal-content/split-entries-modal-content';
import { useSplitEntriesModal, useSplitEntriesModalParams } from '../transaction/context/split-entries-modal.context';

export default function SplitEntriesModal() {
    const [, resolveSplitEntries, dismissSplitEntries] = useSplitEntriesModal();
    const currentParams = useSplitEntriesModalParams();
    const contentStyle = useResolveClassNames('bg-sheet-surface');
    const screenOptions = useModalRouteState(currentParams, dismissSplitEntries);

    if (!currentParams) {
        return null;
    }

    return (
        <View className="bg-sheet-surface" collapsable={false}>
            <Stack.Screen options={{ ...screenOptions, contentStyle }} />
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
