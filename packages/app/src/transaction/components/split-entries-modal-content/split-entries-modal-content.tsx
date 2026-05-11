import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { NotificationFeedbackType } from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import {
    EntryWithLocalIdInterface,
    addLocalId,
    createEmptyEntry,
    entryKeyExtractor,
    stripLocalId
} from '../../utils/entry-with-local-id.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { SplitEntriesAddItemFooter } from '../split-entries-add-item-footer/split-entries-add-item-footer';
import { SplitEntryRow } from '../split-entry-row/split-entry-row';

import { SplitEntriesModalContentSelector } from './split-entries-modal-content.selector';

interface Props {
    readonly initialEntries: TransactionEntryCreateInputInterface[];
    readonly variant: ColorPaletteVariant;
    readonly entryType: TransactionEntryTypeEnum;
    readonly currencySymbol: string;
    readonly totalAmount: number;
    readonly onConfirm: (entries: TransactionEntryCreateInputInterface[]) => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Modal content orchestrating entries list and category selection
export const SplitEntriesModalContent = (props: Props) => {
    const { initialEntries, variant, entryType, currencySymbol, totalAmount, onConfirm } = props;

    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const [openCategorySelector] = useCategorySelectorModal();
    const [hapticNotification] = useVibration();

    const [entries, setEntries] = useState<EntryWithLocalIdInterface[]>(() => initialEntries.map(addLocalId));
    const [autoFocusIndex, setAutoFocusIndex] = useState(-1);

    const previouslyFullySplitRef = useRef(false);

    const entriesTotal = sumEntryAmounts(entries);
    const remainingAmount = totalAmount - entriesTotal;
    const isFullySplit = remainingAmount === 0 && entriesTotal > 0;
    const isOverBudget = remainingAmount < 0;
    const formattedRemaining = formatDigits(Math.abs(remainingAmount), currencySymbol);
    const canDelete = entries.length > 1;
    const accountId = entries[0]?.accountId ?? 0;
    const allEntriesValid = entries.every(entry => isPositiveNumber(entry.categoryId) && entry.amount > 0);
    const allEntriesHaveAmount = entries.every(entry => entry.amount > 0);
    const hasMissingCategories = isFullySplit && !allEntriesValid;
    const canAddEntry = remainingAmount > 0 && allEntriesHaveAmount;
    const canConfirm = isFullySplit && allEntriesValid;

    useEffect(() => {
        if (isFullySplit && !previouslyFullySplitRef.current) {
            hapticNotification(NotificationFeedbackType.Success);
        }
        previouslyFullySplitRef.current = isFullySplit;
    }, [isFullySplit, hapticNotification]);

    const handleAmountChange = (index: number, amount: number) => {
        setEntries(previous => previous.map((entry, entryIndex) => (entryIndex === index ? { ...entry, amount } : entry)));
    };

    const handleCategoryPress = async (index: number) => {
        const currentCategoryId = entries[index]?.categoryId ?? null;
        const excludeCategoryIds = entries
            .filter((_, entryIndex) => entryIndex !== index)
            .map(entry => entry.categoryId)
            .filter(isPositiveNumber);
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: currentCategoryId, excludeCategoryIds, variant });

        if (isDefined(selectedCategoryId)) {
            setEntries(previous =>
                previous.map((entry, entryIndex) => (entryIndex === index ? { ...entry, categoryId: selectedCategoryId } : entry))
            );
        }
    };

    const handleAddEntry = () => {
        const newEntry = createEmptyEntry(entryType, accountId);
        setEntries(previous => [...previous, newEntry]);
        setAutoFocusIndex(entries.length);
    };

    const handleRemoveEntry = (index: number) => {
        setEntries(previous => previous.filter((_, entryIndex) => entryIndex !== index));
        setAutoFocusIndex(-1);
    };

    const handleConfirm = () => {
        onConfirm(entries.map(stripLocalId));
    };

    const renderItem = ({ item, index }: { item: EntryWithLocalIdInterface; index: number }) => {
        const handleCategory = () => void handleCategoryPress(index);
        const handleDelete = () => void handleRemoveEntry(index);
        const handleAmount = (amount: number) => void handleAmountChange(index, amount);

        return (
            <SplitEntryRow
                index={index}
                categoryId={item.categoryId ?? 0}
                amount={item.amount}
                currencySymbol={currencySymbol}
                variant={variant}
                canDelete={canDelete}
                autoFocus={index === autoFocusIndex}
                onAmountChange={handleAmount}
                onCategoryPress={handleCategory}
                onDelete={handleDelete}
            />
        );
    };

    const listFooter = <SplitEntriesAddItemFooter canAddEntry={canAddEntry} onAddEntry={handleAddEntry} />;

    const remainingButtonLabel = isOverBudget ? t`${formattedRemaining} over budget` : t`${formattedRemaining} left to assign`;
    const remainingButtonVariant: ColorPaletteVariant = isOverBudget ? 'destructive' : 'secondary';
    const splitButtonLabel = hasMissingCategories ? t`Select all categories` : t`Confirm Split`;
    const splitButtonVariant = hasMissingCategories ? 'secondary' : variant;
    const confirmButtonVariant = isFullySplit ? splitButtonVariant : remainingButtonVariant;
    const confirmButtonLabel = isFullySplit ? splitButtonLabel : remainingButtonLabel;

    return (
        <View className="flex-1">
            <FlatList
                className="flex-1"
                data={entries}
                keyExtractor={entryKeyExtractor}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="px-xl pt-3xl pb-xl"
                ListFooterComponent={listFooter}
                ItemSeparatorComponent={ListItemSeparator}
            />

            <View className="px-xl pb-xl">
                <Button
                    content={confirmButtonLabel}
                    variant={confirmButtonVariant}
                    size="md"
                    disabled={!canConfirm}
                    onPress={handleConfirm}
                    testID={SplitEntriesModalContentSelector.ConfirmButton}
                />
            </View>
        </View>
    );
};
