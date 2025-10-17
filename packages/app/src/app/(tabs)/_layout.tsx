import { ImpactFeedbackStyle } from 'expo-haptics';
import { Tabs } from 'expo-router';
import { ChartNoAxesColumn, Home, Receipt, Settings } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

import { AiChatButton } from '../../@generic/components/ai-chat-button/ai-chat-button';
import { TabButton } from '../../@generic/components/tab-button/tab-button';
import { useVibration } from '../../@generic/hooks/use-vibration.hook';

export default function TabsLayout() {
    const scheme = useColorScheme();
    const [, hapticImpact] = useVibration();
    const active = scheme === 'dark' ? '#ffffff' : '#0A0A0A';
    const inactive = scheme === 'dark' ? '#888888' : '#737373';
    const bg = scheme === 'dark' ? '#000000' : '#ffffff';
    const border = scheme === 'dark' ? '#222222' : '#e5e7eb';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: active,
                tabBarInactiveTintColor: inactive,
                tabBarStyle: {
                    paddingTop: 18.5,
                    backgroundColor: bg,
                    borderTopColor: border
                }
            }}
        >
            <Tabs.Screen
                listeners={{
                    tabPress: () => void hapticImpact(ImpactFeedbackStyle.Light)
                }}
                name="index"
                options={{
                    tabBarLabelStyle: {
                        fontWeight: '600',
                        paddingTop: 4
                    },
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabButton focused={focused}>
                            <Home color={color} size={size} />
                        </TabButton>
                    )
                }}
            />
            <Tabs.Screen
                listeners={{
                    tabPress: () => void hapticImpact(ImpactFeedbackStyle.Light)
                }}
                name="transactions"
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabButton focused={focused}>
                            <Receipt color={color} size={size} />
                        </TabButton>
                    )
                }}
            />
            <Tabs.Screen name="ai" options={{ tabBarButton: AiChatButton }} />
            <Tabs.Screen
                listeners={{
                    tabPress: () => void hapticImpact(ImpactFeedbackStyle.Light)
                }}
                name="analytics"
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabButton focused={focused}>
                            <ChartNoAxesColumn color={color} size={size} />
                        </TabButton>
                    )
                }}
            />
            <Tabs.Screen
                listeners={{
                    tabPress: () => void hapticImpact(ImpactFeedbackStyle.Light)
                }}
                name="settings"
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabButton focused={focused}>
                            <Settings color={color} size={size} />
                        </TabButton>
                    )
                }}
            />
        </Tabs>
    );
}
