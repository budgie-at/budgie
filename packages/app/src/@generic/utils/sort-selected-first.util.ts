interface WithId {
    readonly id: number;
}

export const sortSelectedFirst = <T extends WithId>(items: T[], selectedIds: number[]): T[] => {
    if (selectedIds.length === 0) {
        return items;
    }

    const selectedSet = new Set(selectedIds);

    return [...items].sort((first, second) => {
        const firstSelected = selectedSet.has(first.id);
        const secondSelected = selectedSet.has(second.id);

        if (firstSelected && !secondSelected) {
            return -1;
        }

        if (!firstSelected && secondSelected) {
            return 1;
        }

        return 0;
    });
};
