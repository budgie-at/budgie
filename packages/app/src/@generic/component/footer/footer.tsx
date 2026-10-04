import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const Footer = ({ children }: Props) => (
    <View className="gap-md pt-xl px-7xl pb-safe border-t border-t-secondary-corner bg-primary-reverse">{children}</View>
);
