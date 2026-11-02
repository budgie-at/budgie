import {
    CategorySourceEnum,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    UserIconNameEnum,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { SheetTitle } from '../../../@generic/component/sheet-title/sheet-title';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { DEFAULT_DECIMAL_PLACES } from '../../../i18n/constant/default-decimal-places.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import {
    EntryWithLocalIdInterface,
    addLocalId,
    createEmptyEntry,
    stripLocalId,
    withEntryAmount
} from '../../utils/entry-with-local-id.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { SplitEntriesAddItemFooter } from '../split-entries-add-item-footer/split-entries-add-item-footer';
import { SplitEntryDeleteButton } from '../split-entry-delete-button/split-entry-delete-button';
import { SplitEntryRow } from '../split-entry-row/split-entry-row';

import { SplitEntriesModalContentSelector } from './split-entries-modal-content.selector';

const SHEET_MAX_HEIGHT_RATIO = 0.7;
const SHEET_CHROME_HEIGHT = 160;
const keyboardOffset = { closed: 0, opened: 8 };
const CONTENT_CONTAINER_STYLE = { paddingHorizontal: 16, paddingBottom: 12 };

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

    const { height, fontScale } = useWindowDimensions();
    const scrollStyle = { maxHeight: Math.max(100, height * SHEET_MAX_HEIGHT_RATIO - SHEET_CHROME_HEIGHT * fontScale), flexGrow: 0 };
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const splitRemainderDecimalPlaces = Math.max(decimalPlaces, DEFAULT_DECIMAL_PLACES);
    const formatDigits = useFormatDigits(splitRemainderDecimalPlaces);
    const [openCategorySelector] = useCategorySelectorModal();
    const [hapticNotification] = useVibration();

    const [entries, setEntries] = useState<EntryWithLocalIdInterface[]>(() => initialEntries.map(addLocalId));
    const [autoFocusIndex, setAutoFocusIndex] = useState(-1);

    const entriesTotalMicroUnits = convertToMicroUnits(sumEntryAmounts(entries));
    const totalAmountMicroUnits = convertToMicroUnits(totalAmount);
    const remainingAmountMicroUnits = totalAmountMicroUnits - entriesTotalMicroUnits;
    const remainingAmount = convertFromMicroUnits(remainingAmountMicroUnits);
    const isFullySplit = remainingAmountMicroUnits === 0 && entriesTotalMicroUnits > 0;
    const isOverBudget = remainingAmountMicroUnits < 0;
    const formattedRemaining = formatDigits(Math.abs(remainingAmount), currencySymbol);
    const canDelete = entries.length > 1;
    const canRemoveSplit = initialEntries.length > 1 || entries.length > 1;
    const accountId = entries[0]?.accountId ?? 0;
    const allEntriesValid = entries.every(entry => isPositiveNumber(entry.categoryId) && isPositiveNumber(entry.amount));
    const allEntriesHaveAmount = entries.every(entry => isPositiveNumber(entry.amount));
    const hasMissingCategories = isFullySplit && !allEntriesValid;
    const canAddEntry = remainingAmountMicroUnits > 0 && allEntriesHaveAmount;
    const canConfirm = isFullySplit && allEntriesValid;

    const applyEntries = (nextEntries: EntryWithLocalIdInterface[]) => {
        const nextEntriesTotalMicroUnits = convertToMicroUnits(sumEntryAmounts(nextEntries));

        if (!isFullySplit && nextEntriesTotalMicroUnits > 0 && nextEntriesTotalMicroUnits === totalAmountMicroUnits) {
            hapticNotification(NotificationFeedbackType.Success);
        }

        setEntries(nextEntries);
    };

    const handleAmountChange = (index: number, amount: number) => {
        applyEntries(entries.map((entry, entryIndex) => (entryIndex === index ? withEntryAmount(entry, amount) : entry)));
    };

    const handleCategoryPress = (index: number) => {
        const currentCategoryId = entries[index]?.categoryId ?? null;
        const excludeCategoryIds = entries
            .filter((_, entryIndex) => entryIndex !== index)
            .map(entry => entry.categoryId)
            .filter(isPositiveNumber);

        openCategorySelector({ initialCategoryId: currentCategoryId, excludeCategoryIds, variant }, selectedCategoryId => {
            if (isDefined(selectedCategoryId)) {
                setEntries(previous =>
                    previous.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, categoryId: selectedCategoryId, categorySource: CategorySourceEnum.USER } : entry
                    )
                );
            }
        });
    };

    const handleAddEntry = () => {
        const newEntry = createEmptyEntry(entryType, accountId);
        setEntries(previous => [...previous, newEntry]);
        setAutoFocusIndex(entries.length);
    };

    const handleRemoveEntry = (index: number) => {
        applyEntries(entries.filter((_, entryIndex) => entryIndex !== index));
        setAutoFocusIndex(-1);
    };

    const handleConfirm = () => {
        onConfirm(entries.map(stripLocalId));
    };

    const handleRemoveSplit = () => {
        const [firstEntry] = entries;

        if (!isDefined(firstEntry)) {
            return;
        }

        appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const confirmed = yield* confirmAlert({
                        title: t`Remove split?`,
                        message: t`This will keep one entry with the full transaction amount.`,
                        confirmText: t`Remove split`,
                        cancelText: t`Cancel`,
                        isDestructive: true
                    });

                    if (confirmed) {
                        onConfirm([stripLocalId(withEntryAmount(firstEntry, totalAmount))]);
                    }
                })
            )
        );
    };

    const renderEntry = (item: EntryWithLocalIdInterface, index: number) => {
        const handleCategory = () => {
            handleCategoryPress(index);
        };
        const handleDelete = () => void handleRemoveEntry(index);
        const handleAmount = (amount: number) => void handleAmountChange(index, amount);

        return (
            <View key={item.localId}>
                <SplitEntryRow
                    index={index}
                    entry={item}
                    currencySymbol={currencySymbol}
                    autoFocus={index === autoFocusIndex}
                    onAmountChange={handleAmount}
                    onCategoryPress={handleCategory}
                >
                    {canDelete ? <SplitEntryDeleteButton index={index} categoryId={item.categoryId} onPress={handleDelete} /> : null}
                </SplitEntryRow>
                {index < entries.length - 1 ? <View className="h-hairline bg-surface-separator ml-[72px]" /> : null}
            </View>
        );
    };

    const assignedLabel = isFullySplit ? t`Fully assigned` : t`${formattedRemaining} left to assign`;
    const pendingLabel = hasMissingCategories ? t`Select all categories` : assignedLabel;
    const remainderLabel = isOverBudget ? t`${formattedRemaining} over budget` : pendingLabel;
    const remainderClassName = isOverBudget ? 'text-destructive-strong' : 'text-secondary-foreground';

    return (
        <View className="bg-sheet-surface">
            <SheetTitle title={t`Split`} />

            <ScrollView contentContainerStyle={CONTENT_CONTAINER_STYLE} keyboardShouldPersistTaps="handled" style={scrollStyle}>
                <GroupedListSection>{entries.map(renderEntry)}</GroupedListSection>
                <SplitEntriesAddItemFooter canAddEntry={canAddEntry} onAddEntry={handleAddEntry} />
                <View className="pt-lg flex-row items-center justify-center gap-x-sm">
                    {canConfirm ? <Icon icon={UserIconNameEnum.Check} size={16} className="text-secondary-foreground" /> : null}
                    <Text className={cn('text-center text-[15px] leading-[20px] shrink', remainderClassName)}>{remainderLabel}</Text>
                </View>
                {canRemoveSplit ? (
                    <View className="pt-xl">
                        <GroupedListSection>
                            <HapticPressable
                                onPress={handleRemoveSplit}
                                accessibilityRole="button"
                                className="min-h-[44px] justify-center px-3xl py-md"
                                testID={SplitEntriesModalContentSelector.RemoveSplitButton}
                            >
                                <Text className="text-md text-destructive-strong">{t`Remove split`}</Text>
                            </HapticPressable>
                        </GroupedListSection>
                    </View>
                ) : null}
            </ScrollView>

            <KeyboardStickyView offset={keyboardOffset}>
                <View className="bg-sheet-surface px-xl pt-3xl pb-safe-or-[16px] ios:pb-0">
                    <PillButton
                        label={t`Done`}
                        isDisabled={!canConfirm}
                        onPress={handleConfirm}
                        testID={SplitEntriesModalContentSelector.ConfirmButton}
                    />
                </View>
            </KeyboardStickyView>
        </View>
    );
};
