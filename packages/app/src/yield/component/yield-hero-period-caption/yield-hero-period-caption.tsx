import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Text } from 'react-native';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDateRange } from '../../../i18n/hook/use-format-date-range.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { yieldPeriodEarnedFamily } from '../../constant/yield-period-earned-family-atom.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldPeriodInterface } from '../../interface/yield-period.interface';

interface Props {
    readonly period: YieldPeriodInterface;
}

export const YieldHeroPeriodCaption = ({ period }: Props) => {
    const { t } = useLingui();
    const formatDateRange = useFormatDateRange();
    const formatAmount = useProtectedAmountLabel();
    const { id, symbol } = useAtomValue(defaultInstrumentAtom);
    const earned = AsyncResult.getOrElse(useLiveAtomValue(yieldPeriodEarnedFamily([period.fromDay, period.toDay, id])), () => null);

    const label = formatDateRange({ from: parseISO(period.fromDay), to: parseISO(period.toDay) }, true);
    const amount = formatAmount(earned?.value ?? 0, symbol);

    return (
        <Text testID={PassiveIncomeSelector.Caption} numberOfLines={1} className="text-[13px] text-secondary-foreground">
            {t`${label}: ${amount}`}
        </Text>
    );
};
