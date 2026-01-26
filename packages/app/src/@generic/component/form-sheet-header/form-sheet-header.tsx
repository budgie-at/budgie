import { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const FormSheetHeader = ({ children }: Props) => (
    <View className="pt-7xl pb-5xl px-3xl">
        <Text className="text-primary text-2xl font-semibold text-center">{children}</Text>
    </View>
);
