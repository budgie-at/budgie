import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const SearchableFilterEmptyResult = ({ children }: Props) => (
    <View className="items-center border border-secondary-corner rounded-5xl bg-secondary-background px-xl py-[30px]">
        <Text className="text-secondary-foreground text-sm">{children}</Text>
    </View>
);
