import { useLingui } from '@lingui/react/macro';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';

const BYTES_PER_MEGABYTE = 1_000_000;
const BYTES_PER_GIGABYTE = 1_000_000_000;

export const useFormatFileSize = () => {
    const { t } = useLingui();
    const formatDigits = useFormatDigits(1);

    return (bytes: number): string => {
        const safeBytes = Math.max(0, bytes);

        if (safeBytes >= BYTES_PER_GIGABYTE) {
            const gigabytes = formatDigits(safeBytes / BYTES_PER_GIGABYTE);

            return t`${gigabytes} GB`;
        }

        const megabytes = formatDigits(Math.max(safeBytes / BYTES_PER_MEGABYTE, 0.1));

        return t`${megabytes} MB`;
    };
};
