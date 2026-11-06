import { convertFromMicroUnits } from '@budgie/contracts';
import { RecurringAlertEnum } from '@budgie/recurring';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

export const useRecurringAlertMessage = () => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();

    return (series: Pick<RecurringSeriesListItemInterface, 'alert' | 'priceChange' | 'endsAt'>): string | null => {
        const { alert, priceChange, endsAt } = series;

        if (alert === RecurringAlertEnum.OVERDUE) {
            return t`A payment was expected but has not been recorded yet.`;
        }

        if (alert === RecurringAlertEnum.PRICE_CHANGE && isDefined(priceChange)) {
            const fromAmount = protectAmount(convertFromMicroUnits(priceChange.fromAmount), defaultInstrument.symbol);
            const toAmount = protectAmount(convertFromMicroUnits(priceChange.toAmount), defaultInstrument.symbol);
            const changedDate = formatMonthAndDayAndOptionalYear(priceChange.changedAt);

            return t`Price went from ${fromAmount} to ${toAmount} on ${changedDate}`;
        }

        if (alert === RecurringAlertEnum.PRICE_CHANGE) {
            return t`The price changed.`;
        }

        if (alert === RecurringAlertEnum.ENDING && isDefined(endsAt)) {
            const endsDate = formatMonthAndDayAndOptionalYear(endsAt);

            return t`Ends on ${endsDate}`;
        }

        return alert === RecurringAlertEnum.ENDING ? t`Ending soon` : null;
    };
};
