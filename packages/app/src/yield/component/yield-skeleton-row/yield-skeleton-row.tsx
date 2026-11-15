import { View } from 'react-native';

export const YieldSkeletonRow = () => (
    <View
        className="h-[60px] flex-row items-center gap-x-xl bg-grouped-surface-row px-3xl"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
    >
        <View className="h-[32px] w-[32px] rounded-full bg-surface-row" />
        <View className="flex-1 gap-y-xs">
            <View className="h-[12px] w-1/2 rounded-md bg-surface-row" />
            <View className="h-[10px] w-1/3 rounded-md bg-surface-row" />
        </View>
    </View>
);
