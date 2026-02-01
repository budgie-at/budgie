import { TransactionCreateInputInterface, TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';
import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

interface UseSplitEntriesConfig {
    readonly entryType: TransactionEntryTypeEnum;
    readonly accountFieldName: 'fromAccountId' | 'toAccountId';
    readonly initialSplitMode?: boolean;
}

export interface UseSplitEntriesReturn {
    readonly isSplitMode: boolean;
    readonly activeEntryIndex: number;
    readonly entries: TransactionEntryCreateInputInterface[];
    readonly entryIds: string[];
    readonly toggleSplitMode: () => void;
    readonly setActiveEntryIndex: (index: number) => void;
    readonly addEntry: () => void;
    readonly removeEntry: (index: number) => void;
    readonly updateEntryAmount: (index: number, amount: number) => void;
    readonly updateEntryCategory: (index: number, categoryId: number) => void;
    readonly totalAmount: number;
}

const createEmptyEntry = (entryType: TransactionEntryTypeEnum, accountId: number): TransactionEntryCreateInputInterface => ({
    accountId,
    categoryId: 0,
    amount: 0,
    type: entryType,
    mccCategoryId: null,
    externalId: null
});

export const useSplitEntries = ({
    entryType,
    accountFieldName,
    initialSplitMode = false
}: UseSplitEntriesConfig): UseSplitEntriesReturn => {
    const { getValues, control } = useFormContext<TransactionCreateInputInterface>();
    const { fields, append, remove, update, replace } = useFieldArray<TransactionCreateInputInterface, 'entries'>({ name: 'entries' });

    const [isSplitMode, setIsSplitMode] = useState(initialSplitMode);
    const [activeEntryIndex, setActiveEntryIndex] = useState(0);

    const watchedEntries = useWatch({ control, name: 'entries' });

    const entries: TransactionEntryCreateInputInterface[] = watchedEntries;
    const entryIds = fields.map(field => field.id);

    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

    const toggleSplitMode = () => {
        if (!isSplitMode) {
            const currentAmount = getValues('amount');
            const currentCategoryId = getValues('entries.0.categoryId');
            const accountId = getValues(accountFieldName) ?? 0;
            const firstEntry: TransactionEntryCreateInputInterface = {
                accountId,
                categoryId: currentCategoryId,
                amount: currentAmount,
                type: entryType,
                mccCategoryId: null,
                externalId: null
            };
            replace([firstEntry]);
            setActiveEntryIndex(0);
        }
        setIsSplitMode(previous => !previous);
    };

    const addEntry = () => {
        const accountId = getValues(accountFieldName);
        append(createEmptyEntry(entryType, accountId ?? 0));
        setActiveEntryIndex(entries.length);
    };

    const removeEntry = (index: number) => {
        if (entries.length <= 1) {
            return;
        }
        remove(index);
        if (activeEntryIndex >= entries.length - 1) {
            setActiveEntryIndex(Math.max(0, entries.length - 2));
        }
    };

    const updateEntryAmount = (index: number, amount: number) => {
        const currentEntry = getValues(`entries.${index}`);
        update(index, { ...currentEntry, amount });
    };

    const updateEntryCategory = (index: number, categoryId: number) => {
        const currentEntry = getValues(`entries.${index}`);
        update(index, { ...currentEntry, categoryId });
    };

    return {
        isSplitMode,
        activeEntryIndex,
        entries,
        entryIds,
        toggleSplitMode,
        setActiveEntryIndex,
        addEntry,
        removeEntry,
        updateEntryAmount,
        updateEntryCategory,
        totalAmount
    };
};
