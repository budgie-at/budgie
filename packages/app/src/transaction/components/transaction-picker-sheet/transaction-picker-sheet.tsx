import { View } from 'react-native';

import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';

import type { ReactNode } from 'react';

interface Props {
    readonly header: ReactNode;
    readonly footer: ReactNode;
    readonly children: ReactNode;
}

export const TransactionPickerSheet = ({ header, footer, children }: Props) => (
    <SheetSurface>
        <View className="flex-1 pt-xl" collapsable={false}>
            <View className="shrink-0 border-b border-surface-separator px-xl pb-md" collapsable={false}>
                {header}
            </View>
            <View className="flex-1 min-h-0" collapsable={false}>
                {children}
            </View>
            <View className="shrink-0 border-t border-surface-separator px-xl pt-md pb-safe-or-[16px]" collapsable={false}>
                {footer}
            </View>
        </View>
    </SheetSurface>
);
