import { UserIconNameEnum } from '@budgie/contracts';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabButton } from '../../@generic/component/tab-button/tab-button';
import { CreateTransactionTabButton } from '../../transaction/components/create-transaction-tab-button/create-transaction-tab-button';

const BLUR_HEIGHT = 150;
const GRADIENT_COLORS = ['transparent', 'black'] as const;
const GRADIENT_LOCATIONS = [0, 0.6] as const;

export default function TabsLayout() {
    const { bottom } = useSafeAreaInsets();

    const containerStyle = { paddingBottom: bottom };
    const blurContainerStyle = { height: BLUR_HEIGHT };

    return (
        <Tabs>
            <TabSlot />

            <TabList className="hidden">
                <TabTrigger name="home" href="/" />
                <TabTrigger name="transactions" href="/transactions" />
                <TabTrigger name="analytics" href="/analytics" />
                <TabTrigger name="settings" href="/settings" />
            </TabList>

            <View className="absolute inset-x-0 bottom-0" style={blurContainerStyle} pointerEvents="none">
                <MaskedView
                    style={StyleSheet.absoluteFill}
                    maskElement={<LinearGradient colors={GRADIENT_COLORS} locations={GRADIENT_LOCATIONS} style={StyleSheet.absoluteFill} />}
                >
                    <BlurView style={StyleSheet.absoluteFill} intensity={50} tint="dark" experimentalBlurMethod="dimezisBlurView" />
                </MaskedView>
            </View>

            <View className="absolute inset-x-0 bottom-0" pointerEvents="box-none">
                <View className="flex-row items-center justify-between px-lg pb-lg pt-md" style={containerStyle}>
                    <View className="flex-row items-center gap-sm bg-secondary rounded-full px-md py-sm shadow-lg shadow-black/20">
                        <TabTrigger name="home" asChild>
                            <TabButton icon={UserIconNameEnum.Home} />
                        </TabTrigger>

                        <TabTrigger name="transactions" asChild>
                            <TabButton icon={UserIconNameEnum.Receipt} />
                        </TabTrigger>

                        <TabTrigger name="analytics" asChild>
                            <TabButton icon={UserIconNameEnum.ChartNoAxesColumn} />
                        </TabTrigger>

                        <TabTrigger name="settings" asChild>
                            <TabButton icon={UserIconNameEnum.Settings} />
                        </TabTrigger>
                    </View>

                    <CreateTransactionTabButton />
                </View>
            </View>
        </Tabs>
    );
}
