import { convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { toTrueMinus } from '../../@generic/utils/to-true-minus.util';
import { useAccountBalanceQuery } from '../../account/query/use-account-balance.query';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';

import type { AdjustmentTransactionDetailsInterface } from '../interface/adjustment-transaction-details.interface';

export const useAdjustmentBalance = (details: AdjustmentTransactionDetailsInterface, amount: number, isIncrease: boolean) => {
    const { t } = useLingui();
    const { balance } = useAccountBalanceQuery(details.accountId);
    const formatDigits = useFormatDigits(2);
    const isProtected = useIsAmountProtected();
    const original = details.initialIsIncrease ? details.initialAmount : -details.initialAmount;
    const proposed = isIncrease ? amount : -amount;
    const change = convertFromMicroUnits(convertToMicroUnits(proposed) - convertToMicroUnits(original));
    const resultingBalance = convertFromMicroUnits(convertToMicroUnits(balance) + convertToMicroUnits(change));
    const formatted = {
        current: isProtected ? PROTECTED_AMOUNT_PLACEHOLDER : toTrueMinus(formatDigits(balance, details.instrumentSymbol)),
        after: isProtected ? PROTECTED_AMOUNT_PLACEHOLDER : toTrueMinus(formatDigits(resultingBalance, details.instrumentSymbol)),
        original: isProtected
            ? PROTECTED_AMOUNT_PLACEHOLDER
            : `${original > 0 ? '+' : ''}${toTrueMinus(formatDigits(original, details.instrumentSymbol))}`,
        proposed: isProtected
            ? PROTECTED_AMOUNT_PLACEHOLDER
            : `${proposed > 0 ? '+' : ''}${toTrueMinus(formatDigits(proposed, details.instrumentSymbol))}`,
        change: isProtected
            ? PROTECTED_AMOUNT_PLACEHOLDER
            : `${change > 0 ? '+' : ''}${toTrueMinus(formatDigits(change, details.instrumentSymbol))}`
    };
    const { original: originalLabel, proposed: proposedLabel } = formatted;
    const after = isPositiveNumber(amount) ? formatted.after : '—';
    const difference = change === 0 ? t`No change` : formatted.change;

    return {
        balance,
        resultingBalance,
        change,
        after,
        difference,
        current: formatted.current,
        currentAdjustment: t`Current adjustment ${originalLabel}`,
        replacement: isPositiveNumber(amount) ? t`Saving replaces ${originalLabel} with ${proposedLabel}` : t`Enter an amount`,
        preview: t`After saving: ${after}`
    };
};
