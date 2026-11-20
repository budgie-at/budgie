export const roundYieldDelta = (current: number, previous: number, decimalPlaces: number): number => {
    const unit = 10 ** decimalPlaces;

    return (Math.round(current * unit) - Math.round(previous * unit)) / unit;
};
