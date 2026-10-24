import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { View } from 'react-native';

import { EdgeFade } from '@rnw-community/react-native-screen-chrome';

import { AnimatedBackdrop } from '../../@generic/component/animated-backdrop/animated-backdrop';
import { TabButtons } from '../../@generic/component/tab-buttons/tab-buttons';
import { FLOATING_TAB_BAR_HEIGHT } from '../../@generic/constant/floating-tab-bar.constant';
import { useCreateActionContext } from '../../@generic/context/create-action.context';
import { useVoiceInputContext } from '../../ai/context/voice-input.context';
import { useIsOnboardingActive } from '../../onboarding/hook/use-is-onboarding-active.hook';
import { CreateTransactionMenu } from '../../transaction/components/create-transaction-menu/create-transaction-menu';
import { CreateTransactionTrigger } from '../../transaction/components/create-transaction-trigger/create-transaction-trigger';

const TAB_BAR_Z_INDEX = 3;

export default function TabsLayout() {
    const { isMenuOpen, openMenu, setIsMenuOpen } = useCreateActionContext();
    const { isOpen: isVoiceInputOpen, close: closeVoiceInput } = useVoiceInputContext();
    const isOnboardingActive = useIsOnboardingActive();

    const handleCloseMenu = () => void setIsMenuOpen(false);

    const isTransactionMenuOpen = isMenuOpen && !isVoiceInputOpen;
    const isBackdropVisible = isMenuOpen || isVoiceInputOpen;
    const isTabBarVisible = !isOnboardingActive && !isBackdropVisible;
    const tabBarWrapperStyle = { zIndex: TAB_BAR_Z_INDEX };

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

                {isTabBarVisible ? (
                    <>
                        <EdgeFade position="bottom" chromeHeight={FLOATING_TAB_BAR_HEIGHT} />
                        <View className="absolute inset-x-0 bottom-0" pointerEvents="box-none" style={tabBarWrapperStyle}>
                            <View className="flex-row items-center justify-between px-lg pb-safe pt-md">
                                <TabButtons />

                                <CreateTransactionTrigger isOpen={isMenuOpen} onPress={openMenu} />
                            </View>
                        </View>
                    </>
                ) : null}
            </Tabs>

            <AnimatedBackdrop isVisible={isBackdropVisible} onClose={handleBackdropClose} />
            <CreateTransactionMenu isOpen={isTransactionMenuOpen} onClose={handleCloseMenu} />
        </>
    );
}
