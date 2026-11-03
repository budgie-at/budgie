import { MccCategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { SelectorList } from '../@generic/component/selector-list/selector-list';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { useFormsheetListContentStyle } from '../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { MccSelectorRow } from '../mcc-category/component/mcc-selector-row/mcc-selector-row';
import { useGetAllMccCategoriesQuery } from '../mcc-category/query/use-get-all-mcc-categories.query';
import { filterCategories } from '../mcc-category/utils/filter-categories.util';
import { getEmptyIcon } from '../mcc-category/utils/get-empty-icon.util';
import { useRuleMccSelectorModal, useRuleMccSelectorModalParams } from '../rule/context/rule-mcc-selector-modal.context';

import { RuleMccSelectorModalSelector } from './rule-mcc-selector-modal.selector';

const keyExtractor = (item: MccCategoryEntityInterface) => item.id.toString();

export default function RuleMccSelectorModal() {
    const { t } = useLingui();
    const [, resolveRuleMccSelector, dismissRuleMccSelector] = useRuleMccSelectorModal();
    useModalDismiss(dismissRuleMccSelector);
    const currentParams = useRuleMccSelectorModalParams();
    const contentContainerStyle = useFormsheetListContentStyle();
    const [search, setSearch] = useState('');
    const { mccCategories } = useGetAllMccCategoriesQuery();

    const selectedMcc = currentParams?.selectedMcc ?? null;
    const filteredCategories = filterCategories(mccCategories, search);
    const emptyTitle = isNotEmptyString(search) ? t`No MCC codes found` : t`No MCC codes available`;
    const emptyDescription = isNotEmptyString(search) ? t`Try a different search term` : t`MCC categories are not loaded`;

    const lastIndex = filteredCategories.length - 1;

    const renderItem = ({ item, index }: { item: MccCategoryEntityInterface; index: number }) => (
        <MccSelectorRow item={item} index={index} lastIndex={lastIndex} selectedMcc={selectedMcc} onSelect={resolveRuleMccSelector} />
    );

    const listOptions = {
        contentContainerStyle,
        ListEmptyComponent: <EmptyState circleIcon={getEmptyIcon(search)} title={emptyTitle} description={emptyDescription} />
    };

    return (
        <SheetSurface>
            <SelectorModalSearchHeader
                title={t`MCC codes`}
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search by code or description…`}
                testID={RuleMccSelectorModalSelector.SearchInput}
            />

            <SelectorList data={filteredCategories} keyExtractor={keyExtractor} renderItem={renderItem} options={listOptions} />
        </SheetSurface>
    );
}
