import { router } from 'expo-router';
import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { Href } from 'expo-router';

interface Props extends PropsWithChildren {
    readonly href: Href;
    readonly testID: string;
}

const styles = StyleSheet.create({
    tabTarget: {
        position: 'relative'
    }
});

export const TabButtonTarget = ({ children, href, testID }: Props) => {
    const handlePress = () => {
        router.push(href);
    };

    return (
        <View collapsable={false} pointerEvents="box-none" style={styles.tabTarget}>
            {children}
            <HapticPressable
                accessibilityRole="button"
                collapsable={false}
                hitSlop={12}
                nativeID={testID}
                onPress={handlePress}
                style={StyleSheet.absoluteFill}
                testID={testID}
            />
        </View>
    );
};
