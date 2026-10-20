import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';

const BYTES_PER_GIGABYTE = 1_000_000_000;

export const useFormatGigabytes = () => {
    const formatDigits = useFormatDigits(1);

    return (bytes: number): string => formatDigits(Math.max(0, bytes) / BYTES_PER_GIGABYTE);
};
