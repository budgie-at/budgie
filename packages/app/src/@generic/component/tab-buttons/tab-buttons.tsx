import { UserIconNameEnum } from '@budgie/contracts';
import { TabTrigger } from 'expo-router/ui';
import { StyleSheet, View } from 'react-native';

import { TabButton } from '../tab-button/tab-button';

import { TabButtonsSelector } from './tab-buttons.selector';

const styles = StyleSheet.create({
    tabTarget: {
        position: 'relative'
    }
});

export const TabButtons = () => (
    <View className="flex-row items-center gap-sm">
        <View collapsable={false} pointerEvents="box-none" style={styles.tabTarget}>
            <View
                collapsable={false}
                nativeID={TabButtonsSelector.Home}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                testID={TabButtonsSelector.Home}
            />
            <TabTrigger name="home" asChild resetOnFocus>
                <TabButton icon={UserIconNameEnum.Home} />
            </TabTrigger>
        </View>

        <View collapsable={false} pointerEvents="box-none" style={styles.tabTarget}>
            <View
                collapsable={false}
                nativeID={TabButtonsSelector.Transactions}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                testID={TabButtonsSelector.Transactions}
            />
            <TabTrigger name="transactions" asChild resetOnFocus>
                <TabButton icon={UserIconNameEnum.Receipt} />
            </TabTrigger>
        </View>

        <View collapsable={false} pointerEvents="box-none" style={styles.tabTarget}>
            <View
                collapsable={false}
                nativeID={TabButtonsSelector.Analytics}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                testID={TabButtonsSelector.Analytics}
            />
            <TabTrigger name="analytics" asChild resetOnFocus>
                <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} />
            </TabTrigger>
        </View>

        <View collapsable={false} pointerEvents="box-none" style={styles.tabTarget}>
            <View
                collapsable={false}
                nativeID={TabButtonsSelector.Settings}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                testID={TabButtonsSelector.Settings}
            />
            <TabTrigger name="settings" asChild resetOnFocus>
                <TabButton icon={UserIconNameEnum.Settings} />
            </TabTrigger>
        </View>
    </View>
);
