import { UserIconNameEnum } from '@budgie/contracts';
import { TabTrigger } from 'expo-router/ui';
import { View } from 'react-native';

import { TabButton } from '../tab-button/tab-button';

export const TabButtons = () => (
    <View className="flex-row items-center gap-sm">
        <TabTrigger name="home" asChild resetOnFocus>
            <TabButton icon={UserIconNameEnum.Home} />
        </TabTrigger>

        <TabTrigger name="transactions" asChild resetOnFocus>
            <TabButton icon={UserIconNameEnum.Receipt} />
        </TabTrigger>

        <TabTrigger name="analytics" asChild resetOnFocus>
            <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} />
        </TabTrigger>

        <TabTrigger name="settings" asChild resetOnFocus>
            <TabButton icon={UserIconNameEnum.Settings} />
        </TabTrigger>
    </View>
);
