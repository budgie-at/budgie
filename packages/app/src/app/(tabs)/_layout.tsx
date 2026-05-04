import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBackdrop } from '../../@generic/component/animated-backdrop/animated-backdrop';
import { BlurGradient } from '../../@generic/component/blur-gradient/blur-gradient';
import { TabButtons } from '../../@generic/component/tab-buttons/tab-buttons';
import { useCreateActionContext } from '../../@generic/context/create-action.context';
import { useVoiceInputContext } from '../../ai/context/voice-input.context';
import { CreateTransactionMenu } from '../../transaction/components/create-transaction-menu/create-transaction-menu';
import { CreateTransactionTrigger } from '../../transaction/components/create-transaction-trigger/create-transaction-trigger';

export default function TabsLayout() {
    const { bottom } = useSafeAreaInsets();
    const { isMenuOpen, openMenu, setIsMenuOpen } = useCreateActionContext();
    const { isOpen: isVoiceInputOpen, close: closeVoiceInput } = useVoiceInputContext();

    const containerStyle = { paddingBottom: bottom };

    const handleCloseMenu = () => void setIsMenuOpen(false);

    const isTransactionMenuOpen = isMenuOpen && !isVoiceInputOpen;
    const isBackdropVisible = isMenuOpen || isVoiceInputOpen;

    const handleBackdropClose = () => {
        if (isVoiceInputOpen) {
            closeVoiceInput();
        } else if (isMenuOpen) {
            handleCloseMenu();
        }
    };

    return (
        <>
            <Tabs>
                <TabSlot />

                <TabList className="hidden">
                    <TabTrigger name="home" href="/" />
                    <TabTrigger name="transactions" href="/transactions" />
                    <TabTrigger name="analytics" href="/analytics" />
                    <TabTrigger name="settings" href="/settings" />
                </TabList>

                <BlurGradient position="bottom">
                    <View className="absolute inset-x-0 bottom-0" pointerEvents="box-none">
                        <View className="flex-row items-center justify-between px-lg pb-lg pt-md" style={containerStyle}>
                            <TabButtons />

                            <CreateTransactionTrigger isOpen={isMenuOpen} onPress={openMenu} />
                        </View>
                    </View>
                </BlurGradient>
            </Tabs>

            <AnimatedBackdrop isVisible={isBackdropVisible} onClose={handleBackdropClose} />
            <CreateTransactionMenu isOpen={isTransactionMenuOpen} onClose={handleCloseMenu} />
        </>
    );
}
