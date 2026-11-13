export const buildYieldRunningTotal = (totals: readonly number[]): number[] => {
    let cumulative = 0;

    return totals.map(total => {
        cumulative += total;

        return cumulative;
    });
};
