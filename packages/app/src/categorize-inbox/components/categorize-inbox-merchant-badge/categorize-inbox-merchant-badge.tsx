import { Text, View } from 'react-native';

interface Props {
    readonly title: string;
}

export const CategorizeInboxMerchantBadge = ({ title }: Props) => {
    const initial = title.match(/\p{L}/u)?.[0]?.toLocaleUpperCase() ?? '#';

    return (
        <View
            className="h-[36px] w-[36px] items-center justify-center rounded-full bg-secondary-background"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Text className="text-sm font-semibold text-secondary-foreground">{initial}</Text>
        </View>
    );
};
