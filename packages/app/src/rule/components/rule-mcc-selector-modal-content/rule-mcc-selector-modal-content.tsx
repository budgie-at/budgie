import { MccCategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { SelectorList } from '../../../@generic/component/selector-list/selector-list';
import { SelectorModalSearchHeader } from '../../../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorSearchEmptyState } from '../../../@generic/component/selector-search-empty-state/selector-search-empty-state';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useFormsheetListContentStyle } from '../../../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { RuleMccSelectorModalSelector } from '../../../app/rule-mcc-selector-modal.selector';
import { MccSelectorRow } from '../../../mcc-category/component/mcc-selector-row/mcc-selector-row';
import { useGetAllMccCategoriesQuery } from '../../../mcc-category/query/use-get-all-mcc-categories.query';
import { filterCategories } from '../../../mcc-category/utils/filter-categories.util';

const keyExtractor = (item: MccCategoryEntityInterface) => item.id.toString();

interface Props {
    readonly selectedMcc: string | null;
    readonly onCommit: (mcc: string) => void;
}

export const RuleMccSelectorModalContent = ({ selectedMcc, onCommit }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const contentContainerStyle = useFormsheetListContentStyle();
    const commit = useMorphingSheetCommit(onCommit);
    const { mccCategories } = useGetAllMccCategoriesQuery();

    const filteredCategories = filterCategories(mccCategories, search);
    const query = search.trim();
    const lastIndex = filteredCategories.length - 1;

    const renderItem = ({ item, index }: { item: MccCategoryEntityInterface; index: number }) => (
        <MccSelectorRow item={item} index={index} lastIndex={lastIndex} selectedMcc={selectedMcc} onSelect={commit} highlight={query} />
    );

    const listOptions = {
        contentContainerStyle,
        ListEmptyComponent: isNotEmptyString(query) ? (
            <SelectorSearchEmptyState query={query} hint={t`Check the spelling or try a code like 5812.`} />
        ) : (
            <EmptyState
                circleIcon={UserIconNameEnum.CreditCard}
                title={t`No MCC codes available`}
                description={t`MCC categories are not loaded`}
            />
        )
    };

    return (
        <View style={listStyle}>
            <SheetSurface className="pt-lg">
                <SelectorModalSearchHeader
                    title={t`MCC codes`}
                    search={search}
                    onSearchChange={setSearch}
                    placeholder={t`Search by code or description…`}
                    testID={RuleMccSelectorModalSelector.SearchInput}
                />

                <SelectorList data={filteredCategories} keyExtractor={keyExtractor} renderItem={renderItem} options={listOptions} />
            </SheetSurface>
        </View>
    );
};
