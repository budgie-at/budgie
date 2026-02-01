import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
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
    readonly localId: number;
}

let nextLocalId = 1;

const generateLocalId = (): number => {
    const id = nextLocalId;
    nextLocalId += 1;

    return id;
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

    return (
        <View className="flex-1 px-lg pt-lg">
            <View className="flex-row items-center justify-between mb-md">
                <Text className="text-xs font-medium text-tertiary">
                    <Trans>{itemCount} items</Trans>
                </Text>
                <Text className="text-sm font-semibold text-primary">{formattedTotal}</Text>
            </View>

            <ScrollView className="gap-y-xs mb-sm" keyboardShouldPersistTaps="handled">
                {entries.map((entry, index) => {
                    const handleCategory = () => void handleCategoryPress(index);
                    const handleDelete = () => void handleRemoveEntry(index);

                    return (
                        <SplitEntryRow
                            key={entry.localId}
                            categoryId={entry.categoryId ?? 0}
                            amount={entry.amount}
                            currencySymbol={currencySymbol}
                            index={index}
                            canDelete={canDelete}
                            autoFocus={index === autoFocusIndex}
                            onAmountChange={handleAmountChange}
                            onCategoryPress={handleCategory}
                            onDelete={handleDelete}
                        />
                    );
                })}
            </ScrollView>

            <HapticPressable className="flex-row items-center justify-center gap-x-sm py-sm mb-sm" onPress={handleAddEntry}>
                <Icon icon={UserIconNameEnum.Plus} size={16} className="text-primary" />
                <Text className="text-sm font-medium text-primary">
                    <Trans>Add item</Trans>
                </Text>
            </HapticPressable>
        </View>
    );
};
