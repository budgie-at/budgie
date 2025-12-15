import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import React from 'react';

import { BottomTabs } from '../../@generic/components/bottom-tabs/bottom-tabs';
import { TabButton } from '../../@generic/components/tab-button/tab-button';
import { ICONS } from '../../@generic/constant/icons.constant';
import { AiChatButton } from '../../ai/components/ai-chat-button/ai-chat-button';
import { CreateTransactionTab } from '../../transaction/components/create-transaction-tab/create-transaction-tab';

export default function TabsLayout() {
    return (
        <Tabs>
            <TabSlot />

            <TabList asChild>
                <BottomTabs>
                    <TabTrigger asChild href="/home" name="home">
                        <TabButton icon={ICONS.Home} />
                    </TabTrigger>

                    <TabTrigger asChild href="/transactions" name="transactions">
                        <TabButton icon={ICONS.Receipt} />
                    </TabTrigger>

                    <AiChatButton />

                    <TabTrigger asChild href="/analytics" name="analytics">
                        <TabButton icon={ICONS.ChartNoAxesColumn} />
                    </TabTrigger>

                    <CreateTransactionTab />
                </BottomTabs>
            </TabList>
        </Tabs>
    );
}
