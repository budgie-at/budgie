export const splitHeroAmount = (amount: number, decimalPlaces: number, decimalSeparator: string) => {
    const scale = 10 ** decimalPlaces;
    const scaledAmount = Math.round(Math.abs(amount) * scale);
    const whole = Math.floor(scaledAmount / scale);
    const fractionDigits = String(scaledAmount - whole * scale).padStart(decimalPlaces, '0');
    const sign = amount < 0 && scaledAmount > 0 ? '-' : '';

    return { sign, whole, fraction: decimalPlaces > 0 ? `${decimalSeparator}${fractionDigits}` : '' };
};
