import { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
    children: ReactNode;
    title: string;
}

export const CreateAccountGroup = ({ children, title }: Props) => (
    <View className={'gap-y-[12px]'}>
        <Text className={'font-medium uppercase text-secondary-foreground text-[12px]'}>{title}</Text>

        {children}
    </View>
);
