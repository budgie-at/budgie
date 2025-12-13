import { useLingui } from '@lingui/react/macro';
import { ReactNode, RefObject } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isPositiveNumber } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../../../@generic/components/bottom-sheet-view/bottom-sheet-view';
import { Button } from '../../../@generic/components/button/button';
import { IconName } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { BottomSheetSnapPoints } from '../../../@generic/type/bottom-sheet-snap-points.type';
import { TransactionFilterHeader } from '../transaction-filter-header/transaction-filter-header';

interface TransactionMultiSelectFilterProps {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly onApply: EmptyFn;
    readonly onClear: EmptyFn;

    readonly title: string;
    readonly icon: IconName;
    readonly selected?: number;
    readonly hasSelected: boolean;

    readonly snapPoints?: BottomSheetSnapPoints;
    readonly enableDynamicSizing?: boolean;
    readonly useBottomSheetView?: boolean;
    readonly children: ReactNode;
}

export const TransactionBaseFilter = (props: TransactionMultiSelectFilterProps) => {
    const { ref, title, icon, children, onApply, selected, hasSelected, onClear, enableDynamicSizing, snapPoints, useBottomSheetView } =
        props;

    const { bottom } = useSafeAreaInsets();
    const { t } = useLingui();

    const buttonText = isPositiveNumber(selected) ? t`Apply Filter (${selected})` : t`Apply Filter`;
    const style = { paddingBottom: bottom };

    const Wrapper = useBottomSheetView ? BottomSheetView : View;

    return (
        <BottomSheet onDismiss={onClear} enableDynamicSizing={enableDynamicSizing} ref={ref} snapPoints={snapPoints}>
            <Wrapper className="flex-1">
                <TransactionFilterHeader title={title} icon={icon} onClear={onClear} showClear={hasSelected} />

                {children}

                <View className="px-7xl pt-4xl border-t border-t-secondary-corner bg-primary-reverse" style={style}>
                    <Button variant="ghost" onPress={onApply} content={buttonText} />
                </View>
            </Wrapper>
        </BottomSheet>
    );
};
