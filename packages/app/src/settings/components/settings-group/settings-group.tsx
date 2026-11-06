import { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
    title: string;
    children: ReactNode;
}

export const SettingsGroup = ({ title, children }: Props) => (
    <View className="gap-y-lg">
        <Text className="text-xs uppercase text-secondary-foreground">{title}</Text>

        {children}
    </View>
);
