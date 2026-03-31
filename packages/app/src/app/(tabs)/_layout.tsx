import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateTransactionTrigger } from '../../@generic/component/action-button/action-button';
import { AnimatedBackdrop } from '../../@generic/component/animated-backdrop/animated-backdrop';
import { BlurGradient } from '../../@generic/component/blur-gradient/blur-gradient';
import { TabButtons } from '../../@generic/component/tab-buttons/tab-buttons';
import { useCreateActionContext } from '../../@generic/context/create-action.context';
import { VoiceInputOverlay } from '../../ai/component/voice-input-overlay/voice-input-overlay';
import { useLlmContext } from '../../ai/context/llm.context';
import { VoiceInputContext } from '../../ai/context/voice-input.context';
import { CreateTransactionMenu } from '../../transaction/components/create-transaction-menu/create-transaction-menu';

export default function TabsLayout() {
    const { bottom } = useSafeAreaInsets();
    const { isMenuOpen, openMenu, setIsMenuOpen } = useCreateActionContext();
    const { isAvailable: isAiAvailable } = useLlmContext();
    const [isVoiceInputOpen, setIsVoiceInputOpen] = useState(false);

    const containerStyle = { paddingBottom: bottom };

    const handleCloseMenu = () => void setIsMenuOpen(false);

    const handleOpenVoiceInput = () => {
        setIsMenuOpen(false);
        setIsVoiceInputOpen(true);
    };

    const handleCloseVoiceInput = () => void setIsVoiceInputOpen(false);

    const voiceInputContextValue = {
        isOpen: isVoiceInputOpen,
        open: handleOpenVoiceInput,
        close: handleCloseVoiceInput
    };

    const isTransactionMenuOpen = isMenuOpen && !isVoiceInputOpen;
    const isBackdropVisible = isMenuOpen || isVoiceInputOpen;

    const handleBackdropClose = () => {
        if (isVoiceInputOpen) {
            handleCloseVoiceInput();
        } else if (isMenuOpen) {
            handleCloseMenu();
        }
    };

    return (
        <VoiceInputContext value={voiceInputContextValue}>
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
            {isAiAvailable ? <VoiceInputOverlay isOpen={isVoiceInputOpen} onClose={handleCloseVoiceInput} /> : null}
        </VoiceInputContext>
    );
}
