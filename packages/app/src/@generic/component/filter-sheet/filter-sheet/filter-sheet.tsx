import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const FilterSheet = ({ children }: Props) => <View className="flex-1 bg-primary-reverse">{children}</View>;
