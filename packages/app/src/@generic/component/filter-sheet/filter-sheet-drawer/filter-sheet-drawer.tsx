import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const FilterSheetDrawer = ({ children }: Props) => (
    <View className="z-10 gap-y-md border-t border-t-secondary-corner bg-primary-reverse px-xl pt-lg pb-safe-or-[16px]">{children}</View>
);
