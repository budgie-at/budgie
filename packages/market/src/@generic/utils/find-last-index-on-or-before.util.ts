export const findLastIndexOnOrBefore = (sortedDays: readonly string[], day: string): number => {
    let low = 0;
    let high = sortedDays.length;

    while (low < high) {
        const middle = Math.floor((low + high) / 2);

        if ((sortedDays[middle] ?? '') <= day) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    return low - 1;
};
