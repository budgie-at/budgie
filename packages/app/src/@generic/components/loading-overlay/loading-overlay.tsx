import { ActivityIndicator, View } from 'react-native';

export const LoadingOverlay = () => (
    <View className="absolute inset-0 bg-primary-reverse/80 justify-center items-center">
        <ActivityIndicator size="large" color="var(--color-primary)" />
    </View>
);
