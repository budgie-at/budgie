import { Stack, useFocusEffect } from 'expo-router';
import { Keyboard, View } from 'react-native';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { SplitEntriesModalContent } from '../transaction/components/split-entries-modal-content/split-entries-modal-content';
import { useSplitEntriesModal } from '../transaction/context/split-entries-modal.context';

export default function SplitEntriesModal() {
    const [, resolveSplitEntries, currentParams] = useSplitEntriesModal();
    const { backgroundColor, screenOptions } = useModalRouteState(currentParams, resolveSplitEntries, null);

    useFocusEffect(Keyboard.dismiss);

    const containerStyle = { flex: 1, backgroundColor };

    if (!currentParams) {
        return null;
    }

    return (
        <View style={containerStyle} collapsable={false}>
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
