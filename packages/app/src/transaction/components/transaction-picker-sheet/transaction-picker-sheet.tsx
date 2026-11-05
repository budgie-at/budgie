import { ScrollView, Text, View } from 'react-native';

import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { TransactionPickerSheetHeader } from '../transaction-picker-sheet-header/transaction-picker-sheet-header';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly closeLabel: string;
    readonly onClose: () => void;
    readonly footer: ReactNode;
    readonly children: ReactNode;
    readonly testID?: string;
    readonly closeTestID?: string;
    readonly disabled?: boolean;
}

export const TransactionPickerSheet = ({ title, closeLabel, onClose, footer, children, testID, closeTestID, disabled }: Props) => {
    const largeText = useIsAccessibilityTextSize();
    const contentClassName = largeText ? 'grow px-xl pb-safe-or-[16px]' : 'grow px-xl pb-xl';

    return (
        <SheetSurface>
            <View className="flex-1 pt-xl" collapsable={false}>
                <View className="shrink-0 border-b border-surface-separator px-xl pb-md" collapsable={false}>
                    <TransactionPickerSheetHeader
                        title={title}
                        closeLabel={closeLabel}
                        onClose={onClose}
                        closeTestID={closeTestID}
                        disabled={disabled}
                    />
                </View>
                <View className="flex-1 min-h-0" collapsable={false}>
                    <ScrollView
                        className="flex-1"
                        contentContainerClassName={contentClassName}
                        automaticallyAdjustKeyboardInsets
                        keyboardShouldPersistTaps="handled"
                        testID={testID}
                    >
                        {largeText ? (
                            <Text
                                dynamicTypeRamp="title2"
                                accessibilityRole="header"
                                className="pt-xl text-[20px] font-semibold text-primary"
                            >
                                {title}
                            </Text>
                        ) : null}
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
