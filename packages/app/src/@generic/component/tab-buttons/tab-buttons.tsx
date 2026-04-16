import { UserIconNameEnum } from '@budgie/contracts';
import { TabTrigger } from 'expo-router/ui';
import { View } from 'react-native';

import { TabButton } from '../tab-button/tab-button';

import { TabButtonsSelector } from './tab-buttons.selector';

export const TabButtons = () => (
    <View className="flex-row items-center gap-sm">
        <TabTrigger name="home" asChild resetOnFocus>
            <TabButton testID={TabButtonsSelector.Home} icon={UserIconNameEnum.Home} />
        </TabTrigger>

        <TabTrigger name="transactions" asChild resetOnFocus>
            <TabButton testID={TabButtonsSelector.Transactions} icon={UserIconNameEnum.Receipt} />
        </TabTrigger>

        <TabTrigger name="analytics" asChild resetOnFocus>
            <TabButton testID={TabButtonsSelector.Analytics} icon={UserIconNameEnum.ChartNoAxesColumn} />
        </TabTrigger>

        <TabTrigger name="settings" asChild resetOnFocus>
            <TabButton testID={TabButtonsSelector.Settings} icon={UserIconNameEnum.Settings} />
        </TabTrigger>
    </View>
);
