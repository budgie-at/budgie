import { UserIconNameEnum } from '@budgie/contracts';
import { TabTrigger } from 'expo-router/ui';
import { View } from 'react-native';

import { TabButton } from '../tab-button/tab-button';

import { TabButtonsSelector } from './tab-buttons.selector';

export const TabButtons = () => (
    <View className="flex-row items-center gap-sm">
        <View testID={TabButtonsSelector.Home} nativeID={TabButtonsSelector.Home} collapsable={false}>
            <TabTrigger name="home" asChild resetOnFocus>
                <TabButton buttonTestID={TabButtonsSelector.Home} icon={UserIconNameEnum.Home} />
            </TabTrigger>
        </View>

        <View testID={TabButtonsSelector.Transactions} nativeID={TabButtonsSelector.Transactions} collapsable={false}>
            <TabTrigger name="transactions" asChild resetOnFocus>
                <TabButton buttonTestID={TabButtonsSelector.Transactions} icon={UserIconNameEnum.Receipt} />
            </TabTrigger>
        </View>

        <View testID={TabButtonsSelector.Analytics} nativeID={TabButtonsSelector.Analytics} collapsable={false}>
            <TabTrigger name="analytics" asChild resetOnFocus>
                <TabButton buttonTestID={TabButtonsSelector.Analytics} icon={UserIconNameEnum.ChartNoAxesColumn} />
            </TabTrigger>
        </View>

        <View testID={TabButtonsSelector.Settings} nativeID={TabButtonsSelector.Settings} collapsable={false}>
            <TabTrigger name="settings" asChild resetOnFocus>
                <TabButton buttonTestID={TabButtonsSelector.Settings} icon={UserIconNameEnum.Settings} />
            </TabTrigger>
        </View>
    </View>
);
