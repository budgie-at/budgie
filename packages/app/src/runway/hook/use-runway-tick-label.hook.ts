import { useLingui } from '@lingui/react/macro';
import { addMonths } from 'date-fns';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { RUNWAY_HORIZON_MONTHS } from '../constant/runway-horizon-months.constant';

export const useRunwayTickLabel = () => {
    const { t } = useLingui();
    const { formatShortMonth } = useFormatDate();

    return (index: number) => (index === 0 ? t`Now` : formatShortMonth(addMonths(new Date(), RUNWAY_HORIZON_MONTHS[index])));
};
