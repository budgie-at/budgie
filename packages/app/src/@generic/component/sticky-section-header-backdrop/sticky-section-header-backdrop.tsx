import { View } from 'react-native';

export const StickySectionHeaderBackdrop = () => (
    <View className="absolute inset-x-0 top-0 -bottom-[4px]" pointerEvents="none">
        <View className="flex-1 bg-primary-reverse" />
        <View className="h-[12px] bg-linear-to-b from-primary-reverse via-primary-reverse/25 to-transparent" />
    </View>
);
