import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
    readonly children?: ReactNode;
}

export const SimpleQuickFormAmountHeader = ({ children }: Props) => (
    <View className="h-[76px] items-center justify-end gap-xs">{children}</View>
);
