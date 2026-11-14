import { useAtomValue } from '@effect/atom-react/Hooks';
import { format } from 'date-fns/format';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import Animated from 'react-native-reanimated';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { PRESENCE_ENTERING, PRESENCE_EXITING, PRESENCE_LAYOUT } from '../../../@generic/constant/presence-motion.constant';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { yieldPeriodEarnedFamily } from '../../constant/yield-period-earned-family-atom.constant';
import { resolveYieldAnalyticsFocus } from '../../utils/resolve-yield-analytics-focus.util';
import { PassiveIncomeAnalyticsCardContent } from '../passive-income-analytics-card-content/passive-income-analytics-card-content';

import type { DateRangeInterface } from '@budgie/contracts';

interface Props {
    readonly date: DateRangeInterface | null;
}

const DAY_FORMAT = 'yyyy-MM-dd';
const ALL_TIME_START = '0001-01-01';

export const PassiveIncomeAnalyticsCard = ({ date }: Props) => {
    const baseInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const today = useToday();
    const focus = resolveYieldAnalyticsFocus(date, today);
    const period = {
        fromDay: isDefined(date?.from) ? format(date.from, DAY_FORMAT) : ALL_TIME_START,
        toDay: format(date?.to ?? today, DAY_FORMAT)
    };
    const earned = AsyncResult.getOrElse(
        useLiveAtomValue(yieldPeriodEarnedFamily([period.fromDay, period.toDay, baseInstrumentId])),
        () => null
    );

    return isDefined(earned) && isPositiveNumber(earned.value) ? (
        <Animated.View entering={PRESENCE_ENTERING} exiting={PRESENCE_EXITING} layout={PRESENCE_LAYOUT}>
            <PassiveIncomeAnalyticsCardContent earned={earned} focus={focus} period={period} />
        </Animated.View>
    ) : null;
};
