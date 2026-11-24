import { StyleSheet } from 'react-native';
import { Screen } from 'react-native-screens';

import type { TabsDescriptor, TabsSlotRenderOptions } from 'expo-router/ui';

const styles = StyleSheet.create({
    screen: { flex: 1, position: 'relative', height: '100%' },
    focused: { zIndex: 1, display: 'flex', flexShrink: 0, flexGrow: 1 },
    unfocused: { zIndex: -1, display: 'none', flexShrink: 1, flexGrow: 0 }
});

export const renderFrozenTabSlot = (descriptor: TabsDescriptor, { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions) => {
    const { lazy = true, unmountOnBlur = false } = descriptor.options;

    if (unmountOnBlur && !isFocused) {
        return null;
    }

    if (lazy && !loaded && !isFocused) {
        return null;
    }

    const activityState = isFocused ? 2 : 0;
    const screenStyle = [styles.screen, isFocused ? styles.focused : styles.unfocused];

    return (
        <Screen key={descriptor.route.key} enabled={detachInactiveScreens} activityState={activityState} freezeOnBlur style={screenStyle}>
            {descriptor.render()}
        </Screen>
    );
};
