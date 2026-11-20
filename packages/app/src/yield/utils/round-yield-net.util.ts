export const roundYieldNet = (gross: number, tax: number, decimalPlaces: number): number => {
    const unit = 10 ** decimalPlaces;

    return (Math.round(gross * unit) - Math.round(tax * unit)) / unit;
};
