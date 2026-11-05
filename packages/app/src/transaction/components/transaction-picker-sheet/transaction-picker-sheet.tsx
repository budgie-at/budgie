import { ScrollView, View } from 'react-native';

import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly header: ReactNode;
    readonly footer: ReactNode;
    readonly children: ReactNode;
    readonly testID?: string;
}

export const TransactionPickerSheet = ({ header, footer, children, testID }: Props) => {
    const largeText = useIsAccessibilityTextSize();
    const contentClassName = largeText ? 'grow px-xl pb-safe-or-[16px]' : 'grow px-xl pb-xl';

    return (
        <SheetSurface>
            <View className="flex-1 pt-xl" collapsable={false}>
                <View className="shrink-0 border-b border-surface-separator px-xl pb-md" collapsable={false}>
                    {header}
                </View>
                <View className="flex-1 min-h-0" collapsable={false}>
                    <ScrollView
                        className="flex-1"
                        contentContainerClassName={contentClassName}
                        automaticallyAdjustKeyboardInsets
                        keyboardShouldPersistTaps="handled"
                        testID={testID}
                    >
                        {children}
                        {largeText ? <View className="pt-xl">{footer}</View> : null}
                    </ScrollView>
                </View>
                {largeText ? null : (
                    <View className="shrink-0 border-t border-surface-separator px-xl pt-md pb-safe-or-[16px]" collapsable={false}>
                        {footer}
                    </View>
                )}
            </View>
        </SheetSurface>
    );
};
