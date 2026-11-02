import { MccCategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { emptyFn, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BudgieLegendList } from '../@generic/component/budgie-legend-list/budgie-legend-list';
import { CircleIcon } from '../@generic/component/circle-icon/circle-icon';
import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { GroupedListItem } from '../@generic/component/grouped-list-item/grouped-list-item';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorRow } from '../@generic/component/selector-row/selector-row';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { LEGEND_LIST_STYLE } from '../@generic/constant/legend-list.constant';
import { useFormsheetListContentStyle } from '../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useGetAllMccCategoriesQuery } from '../mcc-category/query/use-get-all-mcc-categories.query';
import { formatMccDisplay } from '../mcc-category/utils/format-mcc-display.util';
import { useRuleMccSelectorModal, useRuleMccSelectorModalParams } from '../rule/context/rule-mcc-selector-modal.context';

import { RuleMccSelectorModalSelector } from './rule-mcc-selector-modal.selector';

const keyExtractor = (item: MccCategoryEntityInterface) => item.id.toString();

const filterCategories = (categories: MccCategoryEntityInterface[], search: string) =>
    categories.filter(category => {
        if (!isNotEmptyString(search)) {
            return true;
        }

        const searchLower = search.toLowerCase();

        return (
            category.mcc.toLowerCase().includes(searchLower) ||
            category.shortDescription.toLowerCase().includes(searchLower) ||
            category.fullDescription.toLowerCase().includes(searchLower)
        );
    });

const getEmptyIcon = (search: string) => (isNotEmptyString(search) ? UserIconNameEnum.Search : UserIconNameEnum.CreditCard);

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

    const renderItem = ({ item, index }: { item: MccCategoryEntityInterface; index: number }) => {
        const testID = RuleMccSelectorModalSelector.Card(item.mcc);
        const isSelected = item.mcc === selectedMcc;
        const handleSelect = isSelected ? emptyFn : () => void resolveRuleMccSelector(item.mcc);

        return (
            <GroupedListItem isFirst={index === 0} isLast={index === filteredCategories.length - 1}>
                <SelectorRow
                    testID={testID}
                    isSelected={isSelected}
                    title={formatMccDisplay(item)}
                    subtitle={item.fullDescription}
                    onPress={handleSelect}
                    left={
                        <CircleIcon
                            icon={UserIconNameEnum.CreditCard}
                            size={36}
                            iconSize={18}
                            radius={18}
                            variant="secondary"
                            border={false}
                            className="bg-surface-disc"
                        />
                    }
                />
            </GroupedListItem>
        );
    };

    return (
        <SheetSurface>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search by code or description…`}
                testID={RuleMccSelectorModalSelector.SearchInput}
            />

            {isNotEmptyArray(filteredCategories) ? (
                <View className="absolute inset-0">
                    <BudgieLegendList
                        style={LEGEND_LIST_STYLE}
                        contentContainerStyle={contentContainerStyle}
                        keyboardShouldPersistTaps="handled"
                        data={filteredCategories}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem}
                    />
                </View>
            ) : (
                <EmptyState circleIcon={getEmptyIcon(search)} title={emptyTitle} description={emptyDescription} />
            )}
        </SheetSurface>
    );
}
