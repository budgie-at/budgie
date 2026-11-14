import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { use } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
}

export const YieldChartSummaryText = ({ summary }: Props) => {
    const { t } = useLingui();
    const { screenKey, rangeCaption: caption } = use(YieldScreenContext);
    const { formatMonthAndDay } = useFormatDate();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const { group } = screenKey.key;
    const lastPayout = isDefined(summary.lastPayoutDay) ? formatMonthAndDay(parseISO(summary.lastPayoutDay)) : '';
    const count = summary.payoutCount;
    const amount = formatAmount(summary.earned.value, symbol);
    const groupLabel = isDefined(group) ? t(YIELD_GROUP_LABEL[group]) : '';
    const emptyText = isDefined(group) ? t`No ${groupLabel} in this range` : t`No passive income ${caption} · last payout ${lastPayout}`;
    const payoutsText = t({
        id: 'passive-income.payouts.summary',
        message: plural(count, {
            one: `# payout · ${amount} · ${lastPayout}`,
            other: `# payouts · ${amount} · ${lastPayout}`
        })
    });

    return <Text className="text-center text-md text-secondary-foreground">{count === 0 ? emptyText : payoutsText}</Text>;
};
