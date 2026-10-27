import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const TransactionFieldIcons = ({ children }: Props) => <View className="flex-row py-lg">{children}</View>;
