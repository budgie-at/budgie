import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
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
    readonly onConfirm: () => void;
}

interface EntryWithLocalId extends TransactionEntryCreateInputInterface {
    readonly localId: string;
}

const generateLocalId = (): string => `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
const ANIMATION_DURATION = 200;

// eslint-disable-next-line max-lines-per-function, max-statements -- Modal content orchestrating entries list and category selection
export const SplitEntriesModalContent = (props: Props) => {
    const { initialEntries, variant, entryType, currencySymbol, totalAmount, onEntriesChange, onConfirm } = props;

    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { openCategorySelector } = useCategorySelectorModal();
    const [hapticNotification] = useVibration();

    const [entries, setEntries] = useState<EntryWithLocalId[]>(() => initialEntries.map(addLocalId));
    const [autoFocusIndex, setAutoFocusIndex] = useState(-1);

    const previouslyFullySplitRef = useRef(false);
    const isInitialRenderRef = useRef(true);

    useEffect(() => {
        if (isInitialRenderRef.current) {
            isInitialRenderRef.current = false;

            return;
        }

        onEntriesChange(entries.map(stripLocalId));
    }, [entries, onEntriesChange]);

    const entriesTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
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
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: currentCategoryId, variant });

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

    const listFooter = (
        <View>
            {canAddEntry ? (
                <Animated.View entering={FadeIn.duration(ANIMATION_DURATION)} exiting={FadeOut.duration(ANIMATION_DURATION)}>
                    <HapticPressable
                        className="flex-row items-center justify-center gap-x-md py-xl mt-md rounded-3xl border-2 border-dashed border-secondary-corner"
                        onPress={handleAddEntry}
                    >
                        <Icon icon={UserIconNameEnum.Plus} size={ADD_ICON_SIZE} className="text-primary" />
                        <Text className="text-sm font-semibold text-primary">
                            <Trans>Add item</Trans>
                        </Text>
                    </HapticPressable>
                </Animated.View>
            ) : null}
        </View>
    );

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
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="px-xl pt-3xl pb-xl"
                ListFooterComponent={listFooter}
                ItemSeparatorComponent={ListItemSeparator}
            />

            <View className="px-xl pb-xl">
                <Button content={confirmButtonLabel} variant={confirmButtonVariant} size="md" disabled={!canConfirm} onPress={onConfirm} />
            </View>
        </View>
    );
};
