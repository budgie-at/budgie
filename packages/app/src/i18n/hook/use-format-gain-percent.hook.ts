import { useFormatDigits } from './use-format-digits.hook';

const PERCENT = 100;
const PERCENT_FRACTION_DIGITS = 2;

export const useFormatGainPercent = () => {
    const formatDigits = useFormatDigits(PERCENT_FRACTION_DIGITS);

    return (share: number) => `${formatDigits(Math.abs(share) * PERCENT)}%`;
};
