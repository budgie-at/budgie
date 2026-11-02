import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
    readonly children?: ReactNode;
}

export const QuickFormSecondaryLine = ({ children }: Props) => (
    <View className="min-h-[52px] flex-row items-start justify-center gap-[8px] self-stretch px-xl pt-[8px]">{children}</View>
);
