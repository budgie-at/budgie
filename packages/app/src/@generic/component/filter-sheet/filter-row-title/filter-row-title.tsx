import { ReactNode } from 'react';
import { Text } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const FilterRowTitle = ({ children }: Props) => <Text className="flex-1 text-sm font-medium text-primary">{children}</Text>;
