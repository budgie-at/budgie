import { UserIconNameEnum } from '@budgie/contracts';
import { BlurView } from 'expo-blur';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabButton } from '../../@generic/component/tab-button/tab-button';
import { CreateTransactionTabButton } from '../../transaction/components/create-transaction-tab-button/create-transaction-tab-button';

const HIDDEN_STYLE = { display: 'none' } as const;

export default function TabsLayout() {
    const { bottom } = useSafeAreaInsets();

    const containerStyle = { paddingBottom: bottom };

    return (
        <Tabs>
            <TabSlot />

            <TabList style={HIDDEN_STYLE}>
                <TabTrigger name="home" href="/" />
                <TabTrigger name="transactions" href="/transactions" />
                <TabTrigger name="analytics" href="/analytics" />
                <TabTrigger name="settings" href="/settings" />
            </TabList>

            <BlurView className="absolute inset-x-0 bottom-0 overflow-hidden" intensity={50} tint="dark">
                <View className="flex-row items-center justify-between px-lg pb-lg pt-md" style={containerStyle}>
                    <View className="flex-row items-center gap-sm bg-secondary rounded-full px-md py-sm shadow-lg shadow-black/20">
                        <TabTrigger name="home" asChild>
                            <TabButton icon={UserIconNameEnum.Home} />
                        </TabTrigger>

                        <TabTrigger name="transactions" asChild>
                            <TabButton icon={UserIconNameEnum.Receipt} />
                        </TabTrigger>

                        <TabTrigger name="analytics" asChild>
                            <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} />
                        </TabTrigger>

                        <TabTrigger name="settings" asChild>
                            <TabButton icon={UserIconNameEnum.Settings} />
                        </TabTrigger>
                    </View>

                    <CreateTransactionTabButton />
                </View>
            </BlurView>
        </Tabs>
    );
}
