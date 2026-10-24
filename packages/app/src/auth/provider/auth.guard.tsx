import { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { AppToastHost } from '../../@generic/component/app-toast-host/app-toast-host';
import { EmptyScreen } from '../../@generic/component/empty-screen/empty-screen';
import { useSettingsContext } from '../../settings/context/settings.context';
import { AppLockContent } from '../components/app-lock-content/app-lock-content';
import { AppLockOverlay } from '../components/app-lock-overlay/app-lock-overlay';
import { useAuthContext } from '../context/auth.context';

interface Props {
    readonly children: ReactNode;
}

export const AuthGuard = ({ children }: Props) => {
    const { isUnlocked } = useAuthContext();
    const { isLoading } = useSettingsContext();
    const accessibility = isUnlocked ? 'auto' : 'no-hide-descendants';

    if (isLoading) {
        return <EmptyScreen />;
    }

    return (
        <>
            <View className="flex-1" accessibilityElementsHidden={!isUnlocked} importantForAccessibility={accessibility}>
                {children}
            </View>
            {isUnlocked ? null : (
                <AppLockOverlay>
                    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                        <AppLockContent />
                        <AppToastHost />
                    </SafeAreaProvider>
                </AppLockOverlay>
            )}
        </>
    );
};
