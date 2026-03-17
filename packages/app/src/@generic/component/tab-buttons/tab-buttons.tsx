import { UserIconNameEnum } from '@budgie/contracts';
import { TabTrigger } from 'expo-router/ui';
import { View } from 'react-native';

import { TabBarSelectors } from '../../../@e2e/selectors/tab-bar.selector';
import { TabButton } from '../tab-button/tab-button';

export const TabButtons = () => (
    <View className="flex-row items-center gap-sm">
        <TabTrigger name="home" asChild resetOnFocus>
            <TabButton testID={TabBarSelectors.Home} icon={UserIconNameEnum.Home} />
        </TabTrigger>

        <TabTrigger name="transactions" asChild resetOnFocus>
            <TabButton testID={TabBarSelectors.Transactions} icon={UserIconNameEnum.Receipt} />
        </TabTrigger>

        <TabTrigger name="analytics" asChild resetOnFocus>
            <TabButton testID={TabBarSelectors.Analytics} icon={UserIconNameEnum.ChartNoAxesColumn} />
        </TabTrigger>

        <TabTrigger name="settings" asChild resetOnFocus>
            <TabButton testID={TabBarSelectors.Settings} icon={UserIconNameEnum.Settings} />
        </TabTrigger>
    </View>
);
