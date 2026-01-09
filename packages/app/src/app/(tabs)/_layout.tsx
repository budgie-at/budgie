import { UserIconNameEnum } from '@budgie/contracts';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import React from 'react';

import { BottomTabs } from '../../@generic/component/bottom-tabs/bottom-tabs';
import { TabButton } from '../../@generic/component/tab-button/tab-button';
import { SettingsTabButton } from '../../settings/component/settings-tab-button/settings-tab-button';
import { CreateTransactionTabButton } from '../../transaction/components/create-transaction-tab-button/create-transaction-tab-button';

export default function TabsLayout() {
    return (
        <Tabs>
            <TabSlot />

            <TabList asChild>
                <BottomTabs>
                    <TabTrigger asChild href="/" name="home">
                        <TabButton icon={UserIconNameEnum.Home} />
                    </TabTrigger>

                    <TabTrigger asChild href="/transactions" name="transactions">
                        <TabButton icon={UserIconNameEnum.Receipt} />
                    </TabTrigger>

                    <CreateTransactionTabButton />

                    <TabTrigger asChild href="/analytics" name="analytics">
                        <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} />
                    </TabTrigger>

                    <SettingsTabButton />
                </BottomTabs>
            </TabList>
        </Tabs>
    );
}
