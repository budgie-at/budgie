import { YieldGroupEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_GROUP_LABEL } from '../constant/yield-group-label.constant';

import type { YieldBucketInterface } from '@budgie/market';

const SCRUB_GROUP_LIMIT = 2;

export const useYieldScrubGroupsText = (buckets: readonly YieldBucketInterface[]): string[] => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const groups = Object.values(YieldGroupEnum)
        .filter(group => group !== YieldGroupEnum.TAX)
        .map(group => ({ group, amount: buckets.reduce((sum, item) => sum + item.amounts[group], 0) }))
        .filter(({ amount }) => isPositiveNumber(amount))
        .sort((left, right) => right.amount - left.amount);
    const hiddenCount = Math.max(groups.length - SCRUB_GROUP_LIMIT, 0);
    const shown = groups
        .slice(0, SCRUB_GROUP_LIMIT)
        .map(({ group, amount }) => `${t(YIELD_GROUP_LABEL[group])} ${formatAmount(amount, symbol)}`);

    return hiddenCount > 0 ? [...shown, plural(hiddenCount, { one: '+# more', other: '+# more' })] : shown;
};
