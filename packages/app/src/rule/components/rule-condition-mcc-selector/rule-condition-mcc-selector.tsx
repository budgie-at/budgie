import { MccCategoryEntityInterface, RuleCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchableListBottomSheet } from '../../../@generic/component/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useGetAllMccCategoriesQuery } from '../../../mcc-category/query/use-get-all-mcc-categories.query';

interface Props {
    readonly index: number;
}

const keyExtractor = (item: MccCategoryEntityInterface) => item.id.toString();

const flatListProps = {
    className: 'pt-3 px-xl',
    contentContainerClassName: 'gap-y-lg'
};

const formatMccDisplay = (mcc: MccCategoryEntityInterface) => `${mcc.mcc} - ${mcc.shortDescription}`;

export const RuleConditionMccSelector = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const sheetRef = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');

    const { mccCategories, isLoading } = useGetAllMccCategoriesQuery();

    const handleOpenSheet = () => void sheetRef.current?.open();
    const handleCloseSheet = () => void sheetRef.current?.close();

    const filteredCategories = (mccCategories ?? []).filter(category => {
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

    const renderSelector = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.value`>) => {
        const selectedMcc = (mccCategories ?? []).find(mcc => mcc.mcc === value);
        const displayLabel = selectedMcc ? formatMccDisplay(selectedMcc) : t`Select MCC code`;

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

        const emptyIcon = isNotEmptyString(search) ? UserIconNameEnum.Search : UserIconNameEnum.CreditCard;
        const emptyTitle = isNotEmptyString(search) ? t`No MCC codes found` : t`No MCC codes available`;
        const emptyDescription = isNotEmptyString(search) ? t`Try a different search term` : t`MCC categories are not loaded`;

        return (
            <>
                <HapticPressable
                    onPress={handleOpenSheet}
                    className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
                >
                    <Text className="text-primary text-sm" numberOfLines={1}>
                        {isLoading ? t`Loading...` : displayLabel}
                    </Text>
                </HapticPressable>

                <SearchableListBottomSheet
                    ref={sheetRef}
                    title={t`Select MCC Code`}
                    description={t`Choose a merchant category code`}
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder={t`Search by code or description...`}
                    data={filteredCategories}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    emptyTitle={emptyTitle}
                    emptyDescription={emptyDescription}
                    emptyIcon={emptyIcon}
                    flatListProps={flatListProps}
                />
            </>
        );
    };

    return (
        <FormItem label={t`Value`}>
            <Controller control={control} name={`conditions.${index}.value`} render={renderSelector} />
        </FormItem>
    );
};
