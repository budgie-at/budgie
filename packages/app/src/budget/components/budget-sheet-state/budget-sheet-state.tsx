import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetDataState } from '../budget-data-state/budget-data-state';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly title: string;
    readonly isLoading: boolean;
    readonly isError?: boolean;
    readonly description?: string;
    readonly unavailableTitle?: string;
}

export const BudgetSheetState = (props: Props) => {
    const { title, isLoading, isError, description, unavailableTitle } = props;
    const { t } = useLingui();
    const { height } = useWindowDimensions();
    const windowInsets = initialWindowMetrics?.insets;
    const [headerHeight, setHeaderHeight] = useState(0);
    const scrollViewStyle = {
        flexGrow: 0,
        maxHeight: Math.max(0, height - (windowInsets?.top ?? 0) - (windowInsets?.bottom ?? 0) - headerHeight)
    };
    const handleHeaderLayout = (event: LayoutChangeEvent) => {
        setHeaderHeight(event.nativeEvent.layout.height);
    };
    const handleClose = () => void goBackOrReplace('/');
    const stateDescription =
        description ??
        (isError ? t`Your data could not be loaded. Close this screen and try again.` : t`This budget may have been deleted.`);

    return (
        <View className="bg-sheet-surface" collapsable={false}>
            <View onLayout={handleHeaderLayout}>
                <FormsheetHeader size="md" title={title} titleClassName="leading-tight" />
            </View>
            <ScrollView style={scrollViewStyle} contentInsetAdjustmentBehavior="never">
                <View className="px-5xl pt-md pb-3xl gap-y-xl">
                    <BudgetDataState isLoading={isLoading} isError={isError} description={stateDescription} title={unavailableTitle} />
                    <HapticPressable
                        accessibilityRole="button"
                        accessibilityLabel={t`Close`}
                        onPress={handleClose}
                        className="min-h-[44px] items-center justify-center rounded-full bg-secondary-background px-3xl py-lg"
                    >
                        <Text className="text-md font-semibold text-primary">
                            <Trans>Close</Trans>
                        </Text>
                    </HapticPressable>
                </View>
            </ScrollView>
        </View>
    );
};
