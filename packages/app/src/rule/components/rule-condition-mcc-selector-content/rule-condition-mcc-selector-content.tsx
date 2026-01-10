import { MccCategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchableListBottomSheet } from '../../../@generic/component/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useGetAllMccCategoriesQuery } from '../../../mcc-category/query/use-get-all-mcc-categories.query';
import { useRuleConditionValueField } from '../../hooks/use-rule-condition-value-field.hook';

interface Props {
    readonly index: number;
}

const keyExtractor = (item: MccCategoryEntityInterface) => item.id.toString();

const flatListProps = {
    className: 'pt-3 px-xl',
    contentContainerClassName: 'gap-y-lg'
};

const formatMccDisplay = (mcc: MccCategoryEntityInterface) => `${mcc.mcc} - ${mcc.shortDescription}`;

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

export const RuleConditionMccSelectorContent = ({ index }: Props) => {
    const { t } = useLingui();
    const { value, onChange } = useRuleConditionValueField(index);

    const sheetRef = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');

    const { mccCategories, isLoading } = useGetAllMccCategoriesQuery();

    const handleOpenSheet = () => void sheetRef.current?.open();
    const handleCloseSheet = () => void sheetRef.current?.close();

    const handleSelect = (mcc: string) => {
        onChange(mcc);
        handleCloseSheet();
    };

    const renderItem = ({ item }: { item: MccCategoryEntityInterface }) => (
        <SelectorCard
            identifier={item.mcc}
            isSelected={item.mcc === value}
            title={formatMccDisplay(item)}
            subtitle={<Text className="text-secondary-foreground text-sm">{item.fullDescription}</Text>}
            onSelect={handleSelect}
        />
    );

    const selectedMcc = mccCategories.find(({ mcc }) => mcc === value);
    const displayLabel = selectedMcc ? formatMccDisplay(selectedMcc) : t`Select MCC code`;
    const emptyTitle = isNotEmptyString(search) ? t`No MCC codes found` : t`No MCC codes available`;
    const emptyDescription = isNotEmptyString(search) ? t`Try a different search term` : t`MCC categories are not loaded`;

    return (
        <>
            <HapticPressable
                onPress={handleOpenSheet}
                className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
            >
                <Text className="text-primary text-sm" numberOfLines={1}>
                    {isLoading ? <Trans>Loading...</Trans> : displayLabel}
                </Text>
            </HapticPressable>

            <SearchableListBottomSheet
                ref={sheetRef}
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder={t`Search by code or description...`}
                data={filterCategories(mccCategories, search)}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                emptyTitle={emptyTitle}
                emptyDescription={emptyDescription}
                emptyIcon={getEmptyIcon(search)}
                flatListProps={flatListProps}
            />
        </>
    );
};
