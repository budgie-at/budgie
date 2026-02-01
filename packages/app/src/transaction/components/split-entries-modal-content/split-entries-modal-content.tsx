import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Plural, Trans } from '@lingui/react/macro';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { SplitEntryRow } from '../split-entry-row/split-entry-row';

interface Props {
    readonly initialEntries: TransactionEntryCreateInputInterface[];
    readonly variant: ColorPaletteVariant;
    readonly entryType: TransactionEntryTypeEnum;
    readonly currencySymbol: string;
    readonly onEntriesChange: (entries: TransactionEntryCreateInputInterface[]) => void;
}

interface EntryWithLocalId extends TransactionEntryCreateInputInterface {
    readonly localId: string;
}

let nextLocalId = 0;

const generateLocalId = (): string => {
    nextLocalId += 1;

    return `entry-${Date.now()}-${nextLocalId}`;
};

const addLocalId = (entry: TransactionEntryCreateInputInterface): EntryWithLocalId => ({
    ...entry,
    localId: generateLocalId()
});

const createEmptyEntry = (entryType: TransactionEntryTypeEnum, accountId: number): EntryWithLocalId => ({
    accountId,
    categoryId: 0,
    amount: 0,
    type: entryType,
    mccCategoryId: null,
    externalId: null,
    localId: generateLocalId()
});

const stripLocalId = (entry: EntryWithLocalId): TransactionEntryCreateInputInterface => ({
    accountId: entry.accountId,
    categoryId: entry.categoryId,
    amount: entry.amount,
    type: entry.type,
    mccCategoryId: entry.mccCategoryId,
    externalId: entry.externalId
});

const keyExtractor = (item: EntryWithLocalId) => item.localId;

const ADD_ICON_SIZE = 20;

// eslint-disable-next-line max-lines-per-function, max-statements -- Modal content orchestrating entries list and category selection
export const SplitEntriesModalContent = (props: Props) => {
    const { initialEntries, variant, entryType, currencySymbol, onEntriesChange } = props;

    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { openCategorySelector } = useCategorySelectorModal();

    const [entries, setEntries] = useState<EntryWithLocalId[]>(() => initialEntries.map(addLocalId));
    const [autoFocusIndex, setAutoFocusIndex] = useState(-1);

    const entriesRef = useRef(entries);

    const notifyChange = useCallback(
        (updated: EntryWithLocalId[]) => {
            entriesRef.current = updated;
            onEntriesChange(updated.map(stripLocalId));
        },
        [onEntriesChange]
    );

    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const formattedTotal = formatDigits(totalAmount, currencySymbol);
    const itemCount = entries.length;
    const canDelete = entries.length > 1;
    const accountId = entries[0]?.accountId ?? 0;

    const handleAmountChange = (index: number, amount: number) => {
        setEntries(previous => {
            const updated = previous.map((entry, entryIndex) => (entryIndex === index ? { ...entry, amount } : entry));
            notifyChange(updated);

            return updated;
        });
    };

    const handleCategoryPress = async (index: number) => {
        const currentCategoryId = entries[index]?.categoryId ?? null;
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: currentCategoryId, variant });

        if (isDefined(selectedCategoryId)) {
            setEntries(previous => {
                const updated = previous.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, categoryId: selectedCategoryId } : entry
                );
                notifyChange(updated);

                return updated;
            });
        }
    };

    const handleAddEntry = () => {
        const newEntry = createEmptyEntry(entryType, accountId);
        setEntries(previous => {
            const updated = [...previous, newEntry];
            setAutoFocusIndex(updated.length - 1);
            notifyChange(updated);

            return updated;
        });
    };

    const handleRemoveEntry = (index: number) => {
        setEntries(previous => {
            const updated = previous.filter((_, entryIndex) => entryIndex !== index);
            notifyChange(updated);

            return updated;
        });
    };

    const renderItem = ({ item, index }: { item: EntryWithLocalId; index: number }) => {
        const handleCategory = () => void handleCategoryPress(index);
        const handleDelete = () => void handleRemoveEntry(index);
        const handleAmount = (amount: number) => void handleAmountChange(index, amount);

        return (
            <SplitEntryRow
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

    const listHeader = (
        <View className="flex-row items-center justify-between px-xl pb-lg">
            <Text className="text-sm font-medium text-secondary-foreground">
                <Plural value={itemCount} one="# item" other="# items" />
            </Text>
            <Text className="text-md font-semibold text-primary">{formattedTotal}</Text>
        </View>
    );

    const listFooter = (
        <HapticPressable
            className="flex-row items-center justify-center gap-x-md py-xl mt-md rounded-3xl border-2 border-dashed border-secondary-corner"
            onPress={handleAddEntry}
        >
            <Icon icon={UserIconNameEnum.Plus} size={ADD_ICON_SIZE} className="text-primary" />
            <Text className="text-sm font-semibold text-primary">
                <Trans>Add item</Trans>
            </Text>
        </HapticPressable>
    );

    return (
        <FlatList
            data={entries}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-xl pt-3xl pb-xl"
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            ItemSeparatorComponent={ListItemSeparator}
        />
    );
};
