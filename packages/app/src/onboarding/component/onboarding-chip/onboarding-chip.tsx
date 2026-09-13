import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
}

export const OnboardingChip = ({ label }: Props) => (
    <View className="rounded-full border border-secondary-corner px-2xl py-md self-start">
        <Text className="text-secondary-foreground text-sm font-semibold">{label}</Text>
    </View>
);
