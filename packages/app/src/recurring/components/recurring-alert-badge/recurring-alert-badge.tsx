import { RecurringAlertEnum } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { MetaPillVariant } from '../../../@generic/type/meta-pill-variant.type';
import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

type Props = Pick<RecurringSeriesListItemInterface, 'alert' | 'priceChange' | 'endsAt'>;

const VARIANTS: Record<RecurringAlertEnum, MetaPillVariant> = {
    [RecurringAlertEnum.OVERDUE]: 'destructive',
    [RecurringAlertEnum.PRICE_CHANGE]: 'warning',
    [RecurringAlertEnum.ENDING]: 'default'
};

export const RecurringAlertBadge = ({ alert, priceChange, endsAt }: Props) => {
    const { t } = useLingui();
    const { formatShortMonth } = useFormatDate();

    if (!isDefined(alert)) {
        return null;
    }

    const percent = isDefined(priceChange)
        ? Math.round(((priceChange.toAmount - priceChange.fromAmount) / priceChange.fromAmount) * 100)
        : 0;
    const arrow = percent < 0 ? '↓' : '↑';
    const absolutePercent = Math.abs(percent);
    const priceLabel = isDefined(priceChange) ? `${arrow}${absolutePercent}%` : t`Price changed`;
    const endsMonth = isDefined(endsAt) ? formatShortMonth(endsAt) : '';
    const endingLabel = isDefined(endsAt) ? t`Ends ${endsMonth}` : t`Ending soon`;
    const labels: Record<RecurringAlertEnum, string> = {
        [RecurringAlertEnum.OVERDUE]: t`Overdue`,
        [RecurringAlertEnum.PRICE_CHANGE]: priceLabel,
        [RecurringAlertEnum.ENDING]: endingLabel
    };

    return <MetaPill label={labels[alert]} variant={VARIANTS[alert]} />;
};
