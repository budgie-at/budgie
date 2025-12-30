import { useLingui } from '@lingui/react/macro';
import { ReactNode, RefObject } from 'react';
import { View } from 'react-native';

import { EmptyFn, isPositiveNumber } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../../../@generic/component/bottom-sheet-view/bottom-sheet-view';
import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
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

    const { t } = useLingui();

    const buttonText = isPositiveNumber(selected) ? t`Apply Filter (${selected})` : t`Apply Filter`;

    const Wrapper = useBottomSheetView ? BottomSheetView : View;

    return (
        <BottomSheet onDismiss={onClear} enableDynamicSizing={enableDynamicSizing} ref={ref} snapPoints={snapPoints}>
            <Wrapper className="flex-1">
                <TransactionFilterHeader title={title} icon={icon} onClear={onClear} showClear={hasSelected} />

                {children}

                <Footer>
                    <Button variant="ghost" onPress={onApply} content={buttonText} />
                </Footer>
            </Wrapper>
        </BottomSheet>
    );
};
