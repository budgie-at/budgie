import { UserIconNameEnum } from '@budgie/contracts';
import { TabTrigger } from 'expo-router/ui';
import { View } from 'react-native';

import { TabButton } from '../tab-button/tab-button';

export const TabButtons = () => (
    <View className="flex-row items-center gap-sm">
        <TabTrigger name="home" asChild reset="always">
            <TabButton icon={UserIconNameEnum.Home} testID="TabBar.Home" />
        </TabTrigger>

        <TabTrigger name="transactions" asChild reset="always">
            <TabButton icon={UserIconNameEnum.Receipt} testID="TabBar.Transactions" />
        </TabTrigger>

        <TabTrigger name="analytics" asChild reset="always">
            <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} testID="TabBar.Analytics" />
        </TabTrigger>

        <TabTrigger name="settings" asChild reset="always">
            <TabButton icon={UserIconNameEnum.Settings} testID="TabBar.Settings" />
        </TabTrigger>
    </View>
);
