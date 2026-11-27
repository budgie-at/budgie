import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { use } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: Pick<YieldSummaryInterface, 'lastPayoutDay'>;
}

export const YieldChartSummaryText = ({ summary }: Props) => {
    const { t } = useLingui();
    const { screenKey, rangeCaption: caption } = use(YieldScreenContext);
    const { formatMonthAndDay } = useFormatDate();

    const { group } = screenKey.key;
    const lastPayout = isDefined(summary.lastPayoutDay) ? formatMonthAndDay(parseISO(summary.lastPayoutDay)) : '';
    const groupLabel = isDefined(group) ? t(YIELD_GROUP_LABEL[group]) : '';
    const emptyText = isDefined(group) ? t`No ${groupLabel} in this range` : t`No passive income ${caption} · last payout ${lastPayout}`;

    return <Text className="text-center text-md text-secondary-foreground">{emptyText}</Text>;
};
