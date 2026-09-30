import { TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { t } from '@lingui/core/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { refundsTotalAtom } from '../../constant/refunds-total-atom.constant';
import { RefundedSummaryKindEnum } from '../../enum/refunded-summary-kind.enum';
import { computeRefundedSummary } from '../../utils/compute-refunded-summary.util';
import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly onPress?: () => void;
    readonly testID?: string;
}

export const RefundedPill = ({ transaction, onPress, testID }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const language = useSetting('language');
    const formatDigits = useFormatDigits(decimalPlaces);
    const isRefund = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const result = useAtomValue(refundsTotalAtom([isRefund ? transaction.id : null, language]));
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

    return <TransactionMetaPill label={label} icon={UserIconNameEnum.RotateCcw} onPress={onPress} testID={testID} />;
};
