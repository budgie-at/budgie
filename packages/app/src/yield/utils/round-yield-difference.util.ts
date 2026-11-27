export const roundYieldDifference = (minuend: number, subtrahend: number, decimalPlaces: number): number => {
    const unit = 10 ** decimalPlaces;

    return (Math.round(minuend * unit) - Math.round(subtrahend * unit)) / unit;
};
