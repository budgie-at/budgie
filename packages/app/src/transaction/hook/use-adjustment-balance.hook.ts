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
            : `${original > 0 ? '+\u2060' : ''}${toTrueMinus(formatDigits(original, details.instrumentSymbol)).replace('−', '−\u2060')}`
    };
    const after = isPositiveNumber(amount) ? formatted.after : t`Not set`;

    const spokenAfter = isPositiveNumber(amount) ? formatted.after : t`Not set`;
    const announcement = change === 0 && isPositiveNumber(amount) ? t`Balance unchanged` : t`Balance after saving ${spokenAfter}`;
    const { current, after: next } = formatted;
    const preview = change === 0 ? t`No change` : t`Balance ${current} → ${next}`;

    return {
        resultingBalance,
        announcement,
        after,
        current: formatted.current,
        currentAdjustment: formatted.original,
        preview: isPositiveNumber(amount) ? preview : t`Enter an amount`
    };
};
