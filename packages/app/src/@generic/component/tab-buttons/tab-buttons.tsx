import { UserIconNameEnum } from '@budgie/contracts';
import { TabTrigger } from 'expo-router/ui';
import { View } from 'react-native';

import { TabButton } from '../tab-button/tab-button';

export const TabButtons = () => (
    <View className="flex-row items-center gap-sm">
        <TabTrigger name="home" asChild reset="always">
            <TabButton testID="TabBar.Home" icon={UserIconNameEnum.Home} />
        </TabTrigger>

        <TabTrigger name="transactions" asChild reset="always">
            <TabButton testID="TabBar.Transactions" icon={UserIconNameEnum.Receipt} />
        </TabTrigger>

        <TabTrigger name="analytics" asChild reset="always">
            <TabButton testID="TabBar.Analytics" icon={UserIconNameEnum.ChartNoAxesColumn} />
        </TabTrigger>

        <TabTrigger name="settings" asChild reset="always">
            <TabButton testID="TabBar.Settings" icon={UserIconNameEnum.Settings} />
        </TabTrigger>
    </View>
);
