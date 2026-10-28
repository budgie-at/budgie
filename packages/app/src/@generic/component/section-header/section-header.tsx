import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
}

export const SectionHeader = ({ label }: Props) => (
    <View className="mt-lg flex-row items-center gap-x-md">
        <Text accessibilityRole="header" className="text-xxs uppercase tracking-widest text-secondary-foreground">
            {label}
        </Text>
        <View className="h-px flex-1 bg-secondary-corner" />
    </View>
);
