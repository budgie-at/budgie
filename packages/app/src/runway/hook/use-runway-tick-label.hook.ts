import { useLingui } from '@lingui/react/macro';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { RUNWAY_HORIZON_MONTHS } from '../constant/runway-horizon-months.constant';

const LAST_TICK_INDEX = RUNWAY_HORIZON_MONTHS.length - 1;

export const useRunwayTickLabel = () => {
    const { t } = useLingui();
    const formatDigits = useFormatDigits(0);

    return (index: number) => {
        const monthsLabel = formatDigits(RUNWAY_HORIZON_MONTHS[index]);
        const endLabel = index === LAST_TICK_INDEX ? t`${monthsLabel} mo` : monthsLabel;

        return index === 0 ? t`now` : endLabel;
    };
};
