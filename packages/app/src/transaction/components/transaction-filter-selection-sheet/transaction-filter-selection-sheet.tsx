import { View } from 'react-native';

import { FilterSheetFooter } from '../../../@generic/component/filter-sheet/filter-sheet-footer/filter-sheet-footer';
import { FilterSheetHeader } from '../../../@generic/component/filter-sheet/filter-sheet-header/filter-sheet-header';
import { SelectorSearchRow } from '../../../@generic/component/selector-search-row/selector-search-row';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly searchPlaceholder: string;
    readonly searchValue: string;
    readonly onSearchChange: (value: string) => void;
    readonly searchTestID: string;
    readonly apply: ReactNode;
    readonly bulkToggle: ReactNode;
    readonly children: ReactNode;
}

export const TransactionFilterSelectionSheet = (props: Props) => {
    const { title, searchPlaceholder, searchValue, onSearchChange, searchTestID, apply, bulkToggle, children } = props;
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);

    return (
        <View style={listStyle}>
            <SheetSurface className="pt-lg" header={<FilterSheetHeader title={title} />}>
                {children}

                <FilterSheetFooter>
                    <SelectorSearchRow
                        search={searchValue}
                        onSearchChange={onSearchChange}
                        placeholder={searchPlaceholder}
                        testID={searchTestID}
                    />
                    <View className="flex-row items-center gap-x-md">
                        {bulkToggle}
                        {apply}
                    </View>
                </FilterSheetFooter>
            </SheetSurface>
        </View>
    );
};
