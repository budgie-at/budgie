export const roundYieldParts = (parts: readonly number[], total: number, decimalPlaces: number): readonly number[] => {
    const unit = 10 ** decimalPlaces;
    const targetUnits = Math.round(total * unit);
    const scaled = parts.map(part => Math.max(part, 0) * unit);
    const floors = scaled.map(Math.floor);
    const remainder = targetUnits - floors.reduce((sum, floor) => sum + floor, 0);
    const byRemainder = scaled
        .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
        .sort((left, right) => (remainder >= 0 ? right.fraction - left.fraction : left.fraction - right.fraction));
    const adjustments = new Map(
        byRemainder.slice(0, Math.min(Math.abs(remainder), parts.length)).map(({ index }) => [index, Math.sign(remainder)])
    );

    return floors.map((floor, index) => Math.max(floor + (adjustments.get(index) ?? 0), 0) / unit);
};
