import { isDefined } from '@rnw-community/shared';

const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/u;
const MAX_EXPONENT_MAGNITUDE = 40;
const RADIX = 10;

export const parseBinanceScaledDecimal = (value: string, scale: number): bigint | null => {
    const match = DECIMAL_PATTERN.exec(value.trim());
    if (!isDefined(match)) {
        return null;
    }

    const [, sign, integerDigits = '', fractionDigits = '', exponentText = '0'] = match;
    const exponent = Number.parseInt(exponentText, RADIX);
    if (Math.abs(exponent) > MAX_EXPONENT_MAGNITUDE) {
        return null;
    }

    const digits = BigInt(`${integerDigits}${fractionDigits}`);
    const shift = scale + exponent - fractionDigits.length;
    const scaled = shift >= 0 ? digits * BigInt(RADIX) ** BigInt(shift) : digits / BigInt(RADIX) ** BigInt(-shift);

    return sign === '-' ? -scaled : scaled;
};
