import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useState } from 'react';

import { AnimatedBackdrop } from '../../@generic/component/animated-backdrop/animated-backdrop';
import { FloatingTabBarSurface } from '../../@generic/component/floating-tab-bar-surface/floating-tab-bar-surface';
import { TabButtons } from '../../@generic/component/tab-buttons/tab-buttons';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../@generic/constant/floating-tab-bar.constant';
import { useCreateActionContext } from '../../@generic/context/create-action.context';
import { TabBarBackdropContext } from '../../@generic/context/tab-bar-backdrop.context';
import { TabBarClearanceContext } from '../../@generic/context/tab-bar-clearance.context';
import { TabBarBackdropEnum } from '../../@generic/enum/tab-bar-backdrop.enum';
import { useVoiceInputContext } from '../../ai/context/voice-input.context';
import { useIsOnboardingActive, useIsOnboardingPending } from '../../onboarding/hook/use-is-onboarding-active.hook';
import { CreateTransactionMenu } from '../../transaction/components/create-transaction-menu/create-transaction-menu';
import { CreateTransactionTrigger } from '../../transaction/components/create-transaction-trigger/create-transaction-trigger';

const TAB_BAR_CLEARANCE = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN - 15;

export default function TabsLayout() {
    const [tabBarBackdrop, setTabBarBackdrop] = useState(TabBarBackdropEnum.FADE);
    const { isMenuOpen, openMenu, setIsMenuOpen } = useCreateActionContext();
    const { isOpen: isVoiceInputOpen, close: closeVoiceInput } = useVoiceInputContext();
    const isOnboardingActive = useIsOnboardingActive();
    const isOnboardingPending = useIsOnboardingPending();

    const handleCloseMenu = () => void setIsMenuOpen(false);

    const isTransactionMenuOpen = isMenuOpen && !isVoiceInputOpen;
    const isBackdropVisible = isMenuOpen || isVoiceInputOpen;
    const isTabBarVisible = !isOnboardingActive && !isOnboardingPending && !isBackdropVisible;

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
                <TabBarClearanceContext value={TAB_BAR_CLEARANCE}>
                    <TabBarBackdropContext value={setTabBarBackdrop}>
                        <TabSlot />
                    </TabBarBackdropContext>
                </TabBarClearanceContext>

                <TabList className="hidden">
                    <TabTrigger name="home" href="/" />
                    <TabTrigger name="transactions" href="/transactions" />
                    <TabTrigger name="analytics" href="/analytics" />
                    <TabTrigger name="settings" href="/settings" />
                </TabList>

                {isTabBarVisible ? (
                    <FloatingTabBarSurface backdrop={tabBarBackdrop}>
                        <TabButtons />
                        <CreateTransactionTrigger isOpen={isMenuOpen} onPress={openMenu} />
                    </FloatingTabBarSurface>
                ) : null}
            </Tabs>

            <AnimatedBackdrop isVisible={isBackdropVisible} onClose={handleBackdropClose} />
            <CreateTransactionMenu isOpen={isTransactionMenuOpen} onClose={handleCloseMenu} />
        </>
    );
}
