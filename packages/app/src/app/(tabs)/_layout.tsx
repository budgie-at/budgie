import { UserIconNameEnum } from '@budgie/contracts';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import React from 'react';

import { BottomTabs } from '../../@generic/component/bottom-tabs/bottom-tabs';
import { TabButton } from '../../@generic/component/tab-button/tab-button';
import { AiChatButton } from '../../ai/component/ai-chat-button/ai-chat-button';
import { CreateTransactionTab } from '../../transaction/components/create-transaction-tab/create-transaction-tab';

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

                    <AiChatButton />

                    <TabTrigger asChild href="/analytics" name="analytics">
                        <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} />
                    </TabTrigger>

                    <CreateTransactionTab />
                </BottomTabs>
            </TabList>
        </Tabs>
    );
}
