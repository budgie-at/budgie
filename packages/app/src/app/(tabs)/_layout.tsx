import { UserIconNameEnum } from '@budgie/contracts';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurGradient } from '../../@generic/component/blur-gradient/blur-gradient';
import { TabButton } from '../../@generic/component/tab-button/tab-button';
import { CreateTransactionMenu } from '../../transaction/components/create-transaction-menu/create-transaction-menu';
import { CreateTransactionTrigger } from '../../transaction/components/create-transaction-trigger/create-transaction-trigger';

export default function TabsLayout() {
    const { bottom } = useSafeAreaInsets();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const containerStyle = { paddingBottom: bottom };

    const handleOpenMenu = () => void setIsMenuOpen(true);
    const handleCloseMenu = () => void setIsMenuOpen(false);

    return (
        <>
            <Tabs>
                <TabSlot />

                <TabList className="hidden">
                    <TabTrigger name="home" href="/" />
                    <TabTrigger name="transactions" href="/transactions" />
                    <TabTrigger name="analytics" href="/analytics" />
                    <TabTrigger name="settings" href="/settings" />
                    <TabTrigger name="account/[id]/details" href="/account/[id]/details" />
                </TabList>

                <BlurGradient position="bottom">
                    <View className="absolute inset-x-0 bottom-0" pointerEvents="box-none">
                        <View className="flex-row items-center justify-between px-lg pb-lg pt-md" style={containerStyle}>
                            <View className="flex-row items-center gap-sm">
                                <TabTrigger name="home" asChild reset="always">
                                    <TabButton icon={UserIconNameEnum.Home} />
                                </TabTrigger>

                                <TabTrigger name="transactions" asChild reset="always">
                                    <TabButton icon={UserIconNameEnum.Receipt} />
                                </TabTrigger>

                                <TabTrigger name="analytics" asChild reset="always">
                                    <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} />
                                </TabTrigger>

                                <TabTrigger name="settings" asChild reset="always">
                                    <TabButton icon={UserIconNameEnum.Settings} />
                                </TabTrigger>
                            </View>

                            <CreateTransactionTrigger isOpen={isMenuOpen} onPress={handleOpenMenu} />
                        </View>
                    </View>
                </BlurGradient>
            </Tabs>

            <CreateTransactionMenu isOpen={isMenuOpen} onClose={handleCloseMenu} />
        </>
    );
}
