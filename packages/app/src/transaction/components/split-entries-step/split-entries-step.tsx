import {
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    UserIconNameEnum,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { KeyboardController, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { SheetTitle } from '../../../@generic/component/sheet-title/sheet-title';
import { useMorphingSheetDismiss } from '../../../@generic/context/morphing-sheet.context';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { cn } from '../../../@generic/utils/cn.util';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { DEFAULT_DECIMAL_PLACES } from '../../../i18n/constant/default-decimal-places.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { EntryWithLocalIdInterface, createEmptyEntry, stripLocalId, withEntryAmount } from '../../utils/entry-with-local-id.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { SplitEntriesAddItemFooter } from '../split-entries-add-item-footer/split-entries-add-item-footer';
import { SplitEntriesItem } from '../split-entries-item/split-entries-item';
import { SplitEntriesModalContentSelector } from '../split-entries-modal-content/split-entries-modal-content.selector';

const CONTENT_CONTAINER_STYLE = { paddingHorizontal: 16, paddingBottom: 12 };

interface Props {
    readonly entries: EntryWithLocalIdInterface[];
    readonly isInitiallySplit: boolean;
    readonly entryType: TransactionEntryTypeEnum;
    readonly currencySymbol: string;
    readonly totalAmount: number;
    readonly onEntriesChange: (entries: EntryWithLocalIdInterface[]) => void;
    readonly onCategoryPress: (index: number) => void;
    readonly onConfirm: (entries: TransactionEntryCreateInputInterface[]) => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Step content orchestrating the entries list
export const SplitEntriesStep = (props: Props) => {
    const { entries, isInitiallySplit, entryType, currencySymbol, totalAmount, onEntriesChange, onCategoryPress, onConfirm } = props;
    const dismiss = useMorphingSheetDismiss();

    const { height: windowHeight } = useWindowDimensions();
    const { top } = useSafeAreaInsets();
    const { height } = useReanimatedKeyboardAnimation();
    const sheetStyle = useAnimatedStyle(() => ({ maxHeight: windowHeight - top - Math.abs(height.value) - 24 }));
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const splitRemainderDecimalPlaces = Math.max(decimalPlaces, DEFAULT_DECIMAL_PLACES);
    const formatDigits = useFormatDigits(splitRemainderDecimalPlaces);
    const [hapticNotification] = useVibration();

    const [autoFocusId, setAutoFocusId] = useState<EntryWithLocalIdInterface['localId'] | null>(null);
    const [isAddingEntry, setIsAddingEntry] = useState(false);

    const entriesTotalMicroUnits = convertToMicroUnits(sumEntryAmounts(entries));
    const totalAmountMicroUnits = convertToMicroUnits(totalAmount);
    const remainingAmountMicroUnits = totalAmountMicroUnits - entriesTotalMicroUnits;
    const remainingAmount = convertFromMicroUnits(remainingAmountMicroUnits);
    const isFullySplit = remainingAmountMicroUnits === 0 && entriesTotalMicroUnits > 0;
    const isOverBudget = remainingAmountMicroUnits < 0;
    const formattedRemaining = formatDigits(Math.abs(remainingAmount), currencySymbol);
    const canRemoveSplit = isInitiallySplit || entries.length > 1;
    const accountId = entries[0]?.accountId ?? 0;
    const allEntriesValid = entries.every(entry => isPositiveNumber(entry.categoryId) && isPositiveNumber(entry.amount));
    const allEntriesHaveAmount = entries.every(entry => isPositiveNumber(entry.amount));
    const hasMissingCategories = isFullySplit && !allEntriesValid;
    const canAddEntry = remainingAmountMicroUnits > 0 && allEntriesHaveAmount && !isAddingEntry;
    const canConfirm = isFullySplit && allEntriesValid;

    const applyEntries = (nextEntries: EntryWithLocalIdInterface[]) => {
        const nextEntriesTotalMicroUnits = convertToMicroUnits(sumEntryAmounts(nextEntries));

        if (!isFullySplit && nextEntriesTotalMicroUnits > 0 && nextEntriesTotalMicroUnits === totalAmountMicroUnits) {
            hapticNotification(NotificationFeedbackType.Success);
        }

        onEntriesChange(nextEntries);
    };

    const handleAmountChange = (index: number, amount: number) => {
        applyEntries(entries.map((entry, entryIndex) => (entryIndex === index ? withEntryAmount(entry, amount) : entry)));
    };

    const handleAddEntry = () => {
        const newEntry = createEmptyEntry(entryType, accountId);
        setIsAddingEntry(true);

        appRuntime.runFork(
            logAndContinue(
                Effect.promise(() => KeyboardController.dismiss()).pipe(
                    Effect.andThen(
                        Effect.sync(() => {
                            onEntriesChange([...entries, newEntry]);
                            setAutoFocusId(newEntry.localId);
                            setIsAddingEntry(false);
                        })
                    )
                )
            )
        );
    };

    const handleRemoveEntry = (index: number) => {
        applyEntries(entries.filter((_, entryIndex) => entryIndex !== index));
        setAutoFocusId(null);
    };

    const handleConfirm = () => {
        onConfirm(entries.map(stripLocalId));
        dismiss();
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
                        dismiss();
                    }
                })
            )
        );
    };

    const assignedLabel = isFullySplit ? t`Fully assigned` : t`${formattedRemaining} left to assign`;
    const pendingLabel = hasMissingCategories ? t`Select all categories` : assignedLabel;
    const remainderLabel = isOverBudget ? t`${formattedRemaining} over budget` : pendingLabel;
    const remainderClassName = isOverBudget ? 'text-destructive-strong' : 'text-secondary-foreground';

    return (
        <Animated.View className="bg-sheet-surface" style={sheetStyle}>
            <ScrollView contentContainerStyle={CONTENT_CONTAINER_STYLE} keyboardShouldPersistTaps="handled">
                <SheetTitle title={t`Split`} />
                <GroupedListSection>
                    {entries.map((entry, index) => (
                        <SplitEntriesItem
                            key={entry.localId}
                            entry={entry}
                            index={index}
                            currencySymbol={currencySymbol}
                            autoFocus={entry.localId === autoFocusId}
                            entryCount={entries.length}
                            onAmountChange={handleAmountChange}
                            onCategoryPress={onCategoryPress}
                            onDelete={handleRemoveEntry}
                        />
                    ))}
                </GroupedListSection>
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
                                <Text className="text-md text-destructive-strong">
                                    <Trans>Remove split</Trans>
                                </Text>
                            </HapticPressable>
                        </GroupedListSection>
                    </View>
                ) : null}
                <View className="bg-sheet-surface pt-3xl pb-[16px]">
                    <PillButton
                        label={t`Done`}
                        isDisabled={!canConfirm}
                        onPress={handleConfirm}
                        testID={SplitEntriesModalContentSelector.ConfirmButton}
                    />
                </View>
            </ScrollView>
        </Animated.View>
    );
};
