import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
    readonly children?: ReactNode;
}

export const QuickFormSecondaryLine = ({ children }: Props) => (
    <View className="flex-row items-center justify-center gap-[8px] self-stretch px-xl">{children}</View>
);
