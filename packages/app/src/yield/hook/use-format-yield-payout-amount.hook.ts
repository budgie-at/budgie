import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useFormatInstrumentAmount } from '../../i18n/hook/use-format-instrument-amount.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { getYieldPayoutEntry } from '../utils/get-yield-payout-entry.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const MINUS = '−';

export const useFormatYieldPayoutAmount = () => {
    const formatAmount = useProtectedAmountLabel();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    return (
        transaction: TransactionWithRelationsEntityInterface,
        isTax: boolean,
        siblings: readonly TransactionWithRelationsEntityInterface[] = []
    ): string => {
        const entry = getYieldPayoutEntry(transaction);
        const entries = (isNotEmptyArray(siblings) ? siblings : [transaction]).map(getYieldPayoutEntry).filter(isDefined);
        const baseAmounts = entries.map(item => item.baseAmount);
        const baseAmount =
            baseAmounts.every(isDefined) && isNotEmptyArray(baseAmounts) ? baseAmounts.reduce((sum, amount) => sum + amount, 0) : null;
        const nativeAmount = entries.reduce((sum, item) => sum + item.amount, 0);
        const nativeLabel = isDefined(entry)
            ? formatInstrumentAmount(
                  Math.abs(convertFromMicroUnits(nativeAmount)),
                  entry.account.instrument.symbol,
                  entry.account.instrument.type
              )
            : '';
        const amountLabel = isDefined(baseAmount) ? formatAmount(Math.abs(convertFromMicroUnits(baseAmount)), symbol) : nativeLabel;

        return isTax ? `${MINUS}${amountLabel}` : amountLabel;
    };
};
