import { ScrollView, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly header: ReactNode;
    readonly pinnedFooter?: ReactNode;
    readonly scrollFooter?: ReactNode;
    readonly children: ReactNode;
    readonly testID?: string;
}

export const TransactionPickerSheet = ({ header, pinnedFooter, scrollFooter, children, testID }: Props) => {
    const largeText = useIsAccessibilityTextSize();
    const frameClassName = largeText ? 'flex-1 pt-sm' : 'flex-1 pt-xl';
    const headerClassName = largeText ? 'shrink-0 px-xl' : 'shrink-0 px-xl pb-md';
    const contentClassName = largeText ? 'grow px-xl pb-safe-or-[16px]' : 'grow px-xl pb-xl';

    return (
        <SheetSurface>
            <View className={frameClassName} collapsable={false}>
                <View className={headerClassName} collapsable={false}>
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
                        {isDefined(scrollFooter) ? <View className="pt-xl">{scrollFooter}</View> : null}
                    </ScrollView>
                </View>
                {isDefined(pinnedFooter) ? (
                    <View className="shrink-0 border-t border-surface-separator px-xl pt-md pb-safe-or-[16px]" collapsable={false}>
                        {pinnedFooter}
                    </View>
                ) : null}
            </View>
        </SheetSurface>
    );
};
