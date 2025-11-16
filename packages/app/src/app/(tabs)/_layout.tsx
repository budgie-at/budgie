import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { BottomTabs } from '../../@generic/components/bottom-tabs/bottom-tabs';
import { TabButton } from '../../@generic/components/tab-button/tab-button';
import { ICONS } from '../../@generic/constant/icons.constant';
import { AiChatButton } from '../../ai/components/ai-chat-button/ai-chat-button';
import { CreateTransactionTab } from '../../transaction/components/create-transaction-tab/create-transaction-tab';

export default function TabsLayout() {
    const invisibleTriggerStyle = { display: 'none' } satisfies StyleProp<ViewStyle>;

    return (
        <Tabs>
            <TabSlot />

            <TabList asChild>
                <BottomTabs>
                    <TabTrigger asChild href="/" name="index">
                        <TabButton icon={ICONS.Home} />
                    </TabTrigger>

                    <TabTrigger asChild href="/transactions" name="transactions">
                        <TabButton icon={ICONS.Receipt} />
                    </TabTrigger>

                    <TabTrigger asChild href="/ai" name="ai">
                        <AiChatButton />
                    </TabTrigger>

                    <TabTrigger asChild href="/analytics" name="analytics">
                        <TabButton icon={ICONS.ChartNoAxesColumn} />
                    </TabTrigger>

                    <TabTrigger asChild href="/transactions/create" name="create-transaction">
                        <CreateTransactionTab />
                    </TabTrigger>

                    <TabTrigger style={invisibleTriggerStyle} href="/settings" name="settings" />
                </BottomTabs>
            </TabList>
        </Tabs>
    );
}
