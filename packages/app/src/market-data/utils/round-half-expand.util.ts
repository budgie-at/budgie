export const roundHalfExpand = (value: number, fractionDigits: number): number => {
    const [coefficient, exponent = '0'] = Math.abs(value).toString().split('e');
    const scaled = Number(`${coefficient}e${Number(exponent) + fractionDigits}`);

    if (!Number.isFinite(scaled)) {
        return value;
    }

    const [roundedCoefficient, roundedExponent = '0'] = Math.round(scaled).toString().split('e');

    return Math.sign(value) * Number(`${roundedCoefficient}e${Number(roundedExponent) - fractionDigits}`);
};
