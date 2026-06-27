import { UserIconNameEnum } from '@budgie/contracts';
import { TabTrigger } from 'expo-router/ui';
import { View } from 'react-native';

import { TabButton } from '../tab-button/tab-button';
import { TabButtonTarget } from '../tab-button-target/tab-button-target';

import { TabButtonsSelector } from './tab-buttons.selector';

export const TabButtons = () => (
    <View className="flex-row items-center gap-sm">
        <TabButtonTarget href="/" testID={TabButtonsSelector.Home}>
            <TabTrigger name="home" asChild resetOnFocus>
                <TabButton icon={UserIconNameEnum.Home} />
            </TabTrigger>
        </TabButtonTarget>

        <TabButtonTarget href="/transactions" testID={TabButtonsSelector.Transactions}>
            <TabTrigger name="transactions" asChild resetOnFocus>
                <TabButton icon={UserIconNameEnum.Receipt} />
            </TabTrigger>
        </TabButtonTarget>

        <TabButtonTarget href="/analytics" testID={TabButtonsSelector.Analytics}>
            <TabTrigger name="analytics" asChild resetOnFocus>
                <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} />
            </TabTrigger>
        </TabButtonTarget>

        <TabButtonTarget href="/settings" testID={TabButtonsSelector.Settings}>
            <TabTrigger name="settings" asChild resetOnFocus>
                <TabButton icon={UserIconNameEnum.Settings} />
            </TabTrigger>
        </TabButtonTarget>
    </View>
);
