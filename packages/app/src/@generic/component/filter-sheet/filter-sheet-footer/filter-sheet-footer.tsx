import { View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FilterSheetFooter = ({ children }: Props) => (
    <View className="z-30 shrink-0 gap-y-md border-t border-surface-separator px-xl pt-md pb-[16px]">{children}</View>
);
