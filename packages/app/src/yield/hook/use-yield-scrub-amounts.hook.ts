import { YieldGroupEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import type { YieldBucketInterface } from '@budgie/market';

export const useYieldScrubAmounts = (bucket: YieldBucketInterface | null, scrubAmount: number) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const isAmountProtected = useIsAmountProtected();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const amountOf = (value: number) => (isAmountProtected ? t`hidden amount` : formatAmount(value, symbol));
    const bucketTax = bucket?.amounts[YieldGroupEnum.TAX] ?? 0;

    return { amountText: amountOf(scrubAmount), netText: amountOf((bucket?.total ?? 0) - bucketTax), hasTax: isPositiveNumber(bucketTax) };
};
