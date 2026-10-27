import { TransactionConsolidationTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { refundsTotalAtom } from '../../constant/refunds-total-atom.constant';
import { RefundedSummaryKindEnum } from '../../enum/refunded-summary-kind.enum';
import { computeRefundedSummary } from '../../utils/compute-refunded-summary.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly onPress?: () => void;
    readonly testID?: string;
}

export const RefundedPill = ({ transaction, onPress, testID }: Props) => {
    const language = useSetting('language');
    const formatDigits = useDisplayFormatDigits();
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
    const label = isNotEmptyString(formattedRefundedAmount) ? t`Refunded ${formattedRefundedAmount}` : t`Refunded`;

    return <MetaPill label={label} icon={UserIconNameEnum.RotateCcw} onPress={onPress} testID={testID} />;
};
