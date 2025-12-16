import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../auth/context/auth.context';
import { PinScreen } from '../auth/context/pin-screen';

export default function Index() {
    const { isAuthenticated, hasPin, loading, authenticate } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated]);

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-lg text-foreground">Loading...</Text>
            </View>
        );
    }

    if (!hasPin) {
        return (
            <PinScreen
                mode="setup"
                onSuccess={() => {
                    authenticate();
                }}
            />
        );
    }

    if (!isAuthenticated) {
        return (
            <PinScreen
                mode="verify"
                onSuccess={() => {
                    authenticate();
                }}
            />
        );
    }

    return <Redirect href="/(tabs)" />;
}
