import { convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { toTrueMinus } from '../../@generic/utils/to-true-minus.util';
import { useAccountBalanceQuery } from '../../account/query/use-account-balance.query';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { getAdjustmentBalanceChange } from '../utils/get-adjustment-balance-change.util';

import type { AdjustmentTransactionDetailsInterface } from '../interface/adjustment-transaction-details.interface';

export const useAdjustmentBalance = (details: AdjustmentTransactionDetailsInterface, amount: number, isIncrease: boolean) => {
    const { t } = useLingui();
    const { balance } = useAccountBalanceQuery(details.accountId);
    const formatDigits = useFormatDigits(2);
    const isProtected = useIsAmountProtected();
    const original = details.initialIsIncrease ? details.initialAmount : -details.initialAmount;
    const balanceChange = getAdjustmentBalanceChange(details, amount, isIncrease);
    const resultingBalance = isPositiveNumber(amount)
        ? convertFromMicroUnits(convertToMicroUnits(balance) + convertToMicroUnits(balanceChange))
        : null;
    const formattedResult = isDefined(resultingBalance)
        ? toTrueMinus(formatDigits(resultingBalance, details.instrumentSymbol))
        : t`Not set`;
    const formatted = {
        current: isProtected ? PROTECTED_AMOUNT_PLACEHOLDER : toTrueMinus(formatDigits(balance, details.instrumentSymbol)),
        after: isProtected && isDefined(resultingBalance) ? PROTECTED_AMOUNT_PLACEHOLDER : formattedResult,
        change: isProtected
            ? PROTECTED_AMOUNT_PLACEHOLDER
            : `${balanceChange > 0 ? '+\u2060' : ''}${toTrueMinus(formatDigits(balanceChange, details.instrumentSymbol)).replace('−', '−\u2060')}`,
        original: isProtected
            ? PROTECTED_AMOUNT_PLACEHOLDER
            : `${original > 0 ? '+\u2060' : ''}${toTrueMinus(formatDigits(original, details.instrumentSymbol)).replace('−', '−\u2060')}`
    };

    const spokenAfter = formatted.after;
    const announcement = balanceChange === 0 && isDefined(resultingBalance) ? t`Balance unchanged` : t`Balance after saving ${spokenAfter}`;
    const { current, after: next, change } = formatted;
    const preview = balanceChange === 0 ? t`No change` : t`Balance ${current} → ${next} (${change})`;

    return {
        resultingBalance,
        announcement,
        after: formatted.after,
        current: formatted.current,
        currentAdjustment: formatted.original,
        preview: isDefined(resultingBalance) ? preview : t`Enter an amount`
    };
};
