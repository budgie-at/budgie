import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { ChartNoAxesColumn, Home, Receipt, Settings } from 'lucide-react-native';
import { styled } from 'nativewind';

import { BottomTabs } from '../../@generic/components/bottom-tabs/bottom-tabs';
import { TabButton } from '../../@generic/components/tab-button/tab-button';
import { AiChatButton } from '../../ai-chat/components/ai-chat-button/ai-chat-button';

const Wrapper = styled(Tabs);

export default function TabsLayout() {
    return (
        <Wrapper className="bg-bg-primary flex-1">
            <TabSlot />

            <TabList asChild>
                <BottomTabs>
                    <TabTrigger asChild href="/" name="index">
                        <TabButton icon={Home} />
                    </TabTrigger>
                    <TabTrigger asChild href="/transactions" name="transactions">
                        <TabButton icon={Receipt} />
                    </TabTrigger>

                    <AiChatButton />

                    <TabTrigger asChild href="/analytics" name="analytics">
                        <TabButton icon={ChartNoAxesColumn} />
                    </TabTrigger>
                    <TabTrigger asChild href="/settings" name="settings">
                        <TabButton icon={Settings} />
                    </TabTrigger>
                </BottomTabs>
            </TabList>
        </Wrapper>
    );
}
