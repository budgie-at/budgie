import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

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
    readonly totalAmount: number;
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

const createEmptyEntry = (entryType: TransactionEntryTypeEnum, accountId: number, initialAmount = 0): EntryWithLocalId => ({
    accountId,
    categoryId: 0,
    amount: initialAmount,
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
const CHECK_ICON_SIZE = 14;
const disabledFooterStyle = { opacity: 0.3 };

// eslint-disable-next-line max-lines-per-function, max-statements -- Modal content orchestrating entries list and category selection
export const SplitEntriesModalContent = (props: Props) => {
    const { initialEntries, variant, entryType, currencySymbol, totalAmount, onEntriesChange } = props;

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

    const entriesTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const remainingAmount = totalAmount - entriesTotal;
    const isFullySplit = remainingAmount === 0 && entriesTotal > 0;
    const isOverBudget = remainingAmount < 0;
    const canAddEntry = remainingAmount > 0;
    const formattedRemaining = formatDigits(Math.abs(remainingAmount), currencySymbol);
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
        const currentTotal = entriesRef.current.reduce((sum, entry) => sum + entry.amount, 0);
        const prefillAmount = Math.max(0, totalAmount - currentTotal);
        const newEntry = createEmptyEntry(entryType, accountId, prefillAmount);
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

    const remainingStatusElement = isFullySplit ? (
        <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Check} size={CHECK_ICON_SIZE} className="text-success" />
            <Text className="text-md font-semibold text-success">{formatDigits(0, currencySymbol)}</Text>
        </Animated.View>
    ) : (
        <Text className={`text-md font-semibold ${isOverBudget ? 'text-destructive' : 'text-secondary-foreground'}`}>
            {isOverBudget ? <Trans>-{formattedRemaining} over</Trans> : <Trans>{formattedRemaining} left</Trans>}
        </Text>
    );

    const listHeader = (
        <View className="flex-row items-center justify-between px-xl pb-lg">
            <Text className="text-sm font-medium text-secondary-foreground">
                {itemCount === 1 ? <Trans>1 item</Trans> : <Trans>{itemCount} items</Trans>}
            </Text>
            {remainingStatusElement}
        </View>
    );

    const addButtonDisabledStyle = canAddEntry ? void 0 : disabledFooterStyle;
    const addButtonPointerEvents = canAddEntry ? 'auto' : 'none';

    const listFooter = (
        <HapticPressable
            className="flex-row items-center justify-center gap-x-md py-xl mt-md rounded-3xl border-2 border-dashed border-secondary-corner"
            style={addButtonDisabledStyle}
            pointerEvents={addButtonPointerEvents}
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
