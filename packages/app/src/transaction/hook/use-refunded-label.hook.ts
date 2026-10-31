import { TransactionConsolidationTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { refundsTotalAtom } from '../constant/refunds-total-atom.constant';
import { RefundedSummaryKindEnum } from '../enum/refunded-summary-kind.enum';
import { computeRefundedSummary } from '../utils/compute-refunded-summary.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useRefundedLabel = (transaction: TransactionWithRelationsEntityInterface): string | null => {
    const { t } = useLingui();
    const language = useSetting('language');
    const formatDigits = useProtectedAmountLabel();
    const isRefund = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const result = useLiveAtomValue(refundsTotalAtom([isRefund ? transaction.id : null, language]));
    const refundsTotal = AsyncResult.isSuccess(result) ? result.value : null;

    const summary = isRefund && isDefined(refundsTotal) ? computeRefundedSummary(transaction, refundsTotal) : null;
    const currencySymbol = transaction.entries[0]?.account.instrument.symbol;

    if (!isDefined(summary)) {
        return null;
    }

    const formattedRefundedAmount =
        summary.kind === RefundedSummaryKindEnum.PARTIAL && isNotEmptyString(currencySymbol)
            ? formatDigits(convertFromMicroUnits(summary.refundsTotal), currencySymbol)
            : null;

    return isNotEmptyString(formattedRefundedAmount) ? t`Refunded ${formattedRefundedAmount}` : t`Refunded`;
};
