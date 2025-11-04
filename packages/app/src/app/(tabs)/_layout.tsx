import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { styled } from 'nativewind';
import { useContext } from 'react';

import { AiChatButton } from '../../@ai/components/ai-chat-button/ai-chat-button';
import { BottomTabs } from '../../@generic/components/bottom-tabs/bottom-tabs';
import { TabButton } from '../../@generic/components/tab-button/tab-button';
import { ICONS } from '../../@generic/constant/icons.constant';
import { CreateAccountBottomSheetContext } from '../../@account/provider/create-account-bottom-sheet.provider';

const Wrapper = styled(Tabs);

export default function TabsLayout() {
    const {open} = useContext(CreateAccountBottomSheetContext)

return (
    <Wrapper className="bg-primary-reverse flex-1">
        <TabSlot />

        <TabList asChild>
            <BottomTabs>
                <TabTrigger asChild href="/" name="index">
                    <TabButton icon={ICONS.Home} />
                </TabTrigger>
                <TabTrigger asChild href="/transactions" name="transactions">
                    <TabButton icon={ICONS.Receipt} />
                </TabTrigger>

                <AiChatButton />

                <TabTrigger asChild href="/analytics" name="analytics">
                    <TabButton icon={ICONS.ChartNoAxesColumn} />
                </TabTrigger>

                <TabButton icon={ICONS.Plus} onPress={open} />
            </BottomTabs>
        </TabList>
    </Wrapper>
);
}
