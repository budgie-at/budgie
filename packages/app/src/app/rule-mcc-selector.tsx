import { MccCategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../@generic/component/circle-icon/circle-icon';
import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { SelectorCard } from '../@generic/component/selector-card/selector-card';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useFormsheetListContentStyle } from '../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
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
    const [, resolveRuleMccSelector] = useRuleMccSelectorModal();
    const currentParams = useRuleMccSelectorModalParams();
    const contentContainerStyle = useFormsheetListContentStyle();
    const [search, setSearch] = useState('');
    const { mccCategories } = useGetAllMccCategoriesQuery();

    const selectedMcc = currentParams?.selectedMcc ?? null;
    const filteredCategories = filterCategories(mccCategories, search);
    const emptyTitle = isNotEmptyString(search) ? t`No MCC codes found` : t`No MCC codes available`;
    const emptyDescription = isNotEmptyString(search) ? t`Try a different search term` : t`MCC categories are not loaded`;

    const renderItem = ({ item }: { item: MccCategoryEntityInterface }) => {
        const testID = RuleMccSelectorModalSelector.Card(item.mcc);

        return (
            <SelectorCard
                testID={testID}
                identifier={item.mcc}
                isSelected={item.mcc === selectedMcc}
                title={formatMccDisplay(item)}
                subtitle={<Text className="text-secondary-foreground text-sm">{item.fullDescription}</Text>}
                onSelect={resolveRuleMccSelector}
                iconSlot={<CircleIcon icon={UserIconNameEnum.CreditCard} size={40} iconSize={20} variant="ghost" border={false} />}
            />
        );
    };

    return (
        <View className="flex-1 bg-primary-reverse" collapsable={false}>
            <SelectorModalSearchHeader search={search} onSearchChange={setSearch} placeholder={t`Search by code or description...`} />

            {isNotEmptyArray(filteredCategories) ? (
                <FlatList
                    contentContainerStyle={contentContainerStyle}
                    keyboardShouldPersistTaps="handled"
                    data={filteredCategories}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    className="absolute inset-0 bg-primary-reverse pt-3 px-xl"
                    contentContainerClassName="gap-y-lg"
                />
            ) : (
                <EmptyState circleIcon={getEmptyIcon(search)} title={emptyTitle} description={emptyDescription} />
            )}
        </View>
    );
}
