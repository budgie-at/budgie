import { convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { useState } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';

import { isPositiveNumber } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { createEmptyEntry, withEntryAmount } from '../utils/entry-with-local-id.util';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import type { SplitEntriesEditorConfigInterface } from '../interface/split-entries-editor-config.interface';
import type { EntryWithLocalIdInterface } from '../utils/entry-with-local-id.util';

const computeSplitEntriesAmounts = (entries: EntryWithLocalIdInterface[], totalAmount: number) => {
    const entriesTotalMicroUnits = convertToMicroUnits(sumEntryAmounts(entries));
    const totalAmountMicroUnits = convertToMicroUnits(totalAmount);
    const remainingAmountMicroUnits = totalAmountMicroUnits - entriesTotalMicroUnits;
    const isFullySplit = remainingAmountMicroUnits === 0 && entriesTotalMicroUnits > 0;
    const allEntriesValid = entries.every(entry => isPositiveNumber(entry.categoryId) && isPositiveNumber(entry.amount));
    const allEntriesHaveAmount = entries.every(entry => isPositiveNumber(entry.amount));

    return {
        remainingAmountMicroUnits,
        totalAmountMicroUnits,
        remainingAmount: convertFromMicroUnits(remainingAmountMicroUnits),
        isFullySplit,
        isOverBudget: remainingAmountMicroUnits < 0,
        hasMissingCategories: isFullySplit && !allEntriesValid,
        canConfirm: isFullySplit && allEntriesValid,
        allEntriesHaveAmount
    };
};

export const useSplitEntriesEditor = (config: SplitEntriesEditorConfigInterface) => {
    const { entries, isInitiallySplit, entryType, totalAmount, onEntriesChange } = config;
    const amounts = computeSplitEntriesAmounts(entries, totalAmount);
    const [autoFocusId, setAutoFocusId] = useState<EntryWithLocalIdInterface['localId'] | null>(null);
    const [isAddingEntry, setIsAddingEntry] = useState(false);
    const [hapticNotification] = useVibration();

    const canRemoveSplit = isInitiallySplit || entries.length > 1;
    const canAddEntry = amounts.remainingAmountMicroUnits > 0 && amounts.allEntriesHaveAmount && !isAddingEntry;

    const applyEntries = (nextEntries: EntryWithLocalIdInterface[]) => {
        const nextEntriesTotalMicroUnits = convertToMicroUnits(sumEntryAmounts(nextEntries));

        if (!amounts.isFullySplit && nextEntriesTotalMicroUnits > 0 && nextEntriesTotalMicroUnits === amounts.totalAmountMicroUnits) {
            hapticNotification(NotificationFeedbackType.Success);
        }

        onEntriesChange(nextEntries);
    };

    const handleAmountChange = (index: number, amount: number) => {
        applyEntries(entries.map((entry, entryIndex) => (entryIndex === index ? withEntryAmount(entry, amount) : entry)));
    };

    const handleAddEntry = () => {
        const newEntry = createEmptyEntry(entryType, entries[0]?.accountId ?? 0);
        setIsAddingEntry(true);

        appRuntime.runFork(
            logAndContinue(
                Effect.promise(() => KeyboardController.dismiss()).pipe(
                    Effect.andThen(
                        Effect.sync(() => {
                            onEntriesChange(previous => [...previous, newEntry]);
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

    return { ...amounts, autoFocusId, canAddEntry, canRemoveSplit, handleAmountChange, handleAddEntry, handleRemoveEntry };
};
