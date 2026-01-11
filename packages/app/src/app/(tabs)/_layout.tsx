import { UserIconNameEnum } from '@budgie/contracts';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabButton } from '../../@generic/component/tab-button/tab-button';
import { useThemeContext } from '../../theme/context/theme.context';
import { CreateTransactionMenu } from '../../transaction/components/create-transaction-menu/create-transaction-menu';
import { CreateTransactionTrigger } from '../../transaction/components/create-transaction-trigger/create-transaction-trigger';

const BLUR_HEIGHT = 150;
const GRADIENT_COLORS_DARK = ['transparent', 'black'] as const;
const GRADIENT_COLORS_LIGHT = ['transparent', 'white'] as const;
const GRADIENT_LOCATIONS = [0, 0.6] as const;

export default function TabsLayout() {
    const { bottom } = useSafeAreaInsets();
    const { isDarkColorSchema } = useThemeContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const containerStyle = { paddingBottom: bottom };
    const blurContainerStyle = { height: BLUR_HEIGHT };
    const gradientColors = isDarkColorSchema ? GRADIENT_COLORS_DARK : GRADIENT_COLORS_LIGHT;
    const blurTint = isDarkColorSchema ? 'dark' : 'light';

    const handleOpenMenu = () => void setIsMenuOpen(true);
    const handleCloseMenu = () => void setIsMenuOpen(false);

    return (
        <>
            <Tabs>
                <TabSlot />

                <TabList className="hidden">
                    <TabTrigger name="home" href="/" />
                    <TabTrigger name="transactions" href="/transactions" />
                    <TabTrigger name="analytics" href="/analytics" />
                    <TabTrigger name="settings" href="/settings" />
                    <TabTrigger name="account/[id]/details" href="/account/[id]/details" />
                </TabList>

                <View className="absolute inset-x-0 bottom-0" style={blurContainerStyle} pointerEvents="none">
                    <MaskedView
                        style={StyleSheet.absoluteFill}
                        maskElement={
                            <LinearGradient colors={gradientColors} locations={GRADIENT_LOCATIONS} style={StyleSheet.absoluteFill} />
                        }
                    >
                        <BlurView style={StyleSheet.absoluteFill} intensity={50} tint={blurTint} experimentalBlurMethod="dimezisBlurView" />
                    </MaskedView>
                </View>

                <View className="absolute inset-x-0 bottom-0" pointerEvents="box-none">
                    <View className="flex-row items-center justify-between px-lg pb-lg pt-md" style={containerStyle}>
                        <View className="flex-row items-center gap-sm">
                            <TabTrigger name="home" asChild reset="always">
                                <TabButton icon={UserIconNameEnum.Home} />
                            </TabTrigger>

                            <TabTrigger name="transactions" asChild reset="always">
                                <TabButton icon={UserIconNameEnum.Receipt} />
                            </TabTrigger>

                            <TabTrigger name="analytics" asChild reset="always">
                                <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} />
                            </TabTrigger>

                            <TabTrigger name="settings" asChild reset="always">
                                <TabButton icon={UserIconNameEnum.Settings} />
                            </TabTrigger>
                        </View>

                        <CreateTransactionTrigger isOpen={isMenuOpen} onPress={handleOpenMenu} />
                    </View>
                </View>
            </Tabs>

            <CreateTransactionMenu isOpen={isMenuOpen} onClose={handleCloseMenu} />
        </>
    );
}
