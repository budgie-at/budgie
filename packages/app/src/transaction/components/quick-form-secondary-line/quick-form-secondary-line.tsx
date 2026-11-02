import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
    readonly children?: ReactNode;
}

export const QuickFormSecondaryLine = ({ children }: Props) => (
    <View className="min-h-[44px] flex-row items-center justify-center gap-xs self-stretch px-xl pt-[12px]">{children}</View>
);
