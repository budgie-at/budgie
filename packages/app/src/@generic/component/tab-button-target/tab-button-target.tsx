import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props extends PropsWithChildren {
    readonly testID: string;
}

const styles = StyleSheet.create({
    tabTarget: {
        position: 'relative'
    }
});

export const TabButtonTarget = ({ children, testID }: Props) => (
    <View collapsable={false} pointerEvents="box-none" style={styles.tabTarget}>
        <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
        {children}
    </View>
);
