import { MccCategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../@generic/component/circle-icon/circle-icon';
import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { SelectorCard } from '../@generic/component/selector-card/selector-card';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useGetAllMccCategoriesQuery } from '../mcc-category/query/use-get-all-mcc-categories.query';
import { formatMccDisplay } from '../mcc-category/utils/format-mcc-display.util';
import { useRuleMccSelectorModal } from '../rule/context/rule-mcc-selector-modal.context';

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
    const { currentParams, resolveRuleMccSelector } = useRuleMccSelectorModal();
    const { flatListStyle, contentContainerStyle } = useFormsheetListStyles();
    const [search, setSearch] = useState('');
    const { mccCategories } = useGetAllMccCategoriesQuery();

    const selectedMcc = currentParams?.selectedMcc ?? null;
    const filteredCategories = filterCategories(mccCategories, search);
    const emptyTitle = isNotEmptyString(search) ? t`No MCC codes found` : t`No MCC codes available`;
    const emptyDescription = isNotEmptyString(search) ? t`Try a different search term` : t`MCC categories are not loaded`;

    const renderItem = ({ item }: { item: MccCategoryEntityInterface }) => (
        <SelectorCard
            identifier={item.mcc}
            isSelected={item.mcc === selectedMcc}
            title={formatMccDisplay(item)}
            subtitle={<Text className="text-secondary-foreground text-sm">{item.fullDescription}</Text>}
            onSelect={resolveRuleMccSelector}
            iconSlot={<CircleIcon icon={UserIconNameEnum.CreditCard} size={40} iconSize={20} variant="ghost" border={false} />}
        />
    );

    return (
        <View className="flex-1">
            <SelectorModalSearchHeader search={search} onSearchChange={setSearch} placeholder={t`Search by code or description...`} />

            {isNotEmptyArray(filteredCategories) ? (
                <FlatList
                    style={flatListStyle}
                    contentContainerStyle={contentContainerStyle}
                    keyboardShouldPersistTaps="handled"
                    data={filteredCategories}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    className="pt-3 px-xl"
                    contentContainerClassName="gap-y-lg"
                />
            ) : (
                <EmptyState circleIcon={getEmptyIcon(search)} title={emptyTitle} description={emptyDescription} />
            )}
        </View>
    );
}
