interface EntryWithAmount {
    readonly amount: number;
}

export const sumEntryAmounts = (entries: EntryWithAmount[]): number => entries.reduce((sum, entry) => sum + entry.amount, 0);
