import { DebtEventAssociationEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { getTransactionFeeEntries } from '../../utils/get-transaction-fee-entries.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { DebtSettlementPill } from '../debt-settlement-pill/debt-settlement-pill';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { TransactionMetadataRow } from '../transaction-metadata-row/transaction-metadata-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly refundedPillTestID: string;
    readonly feeTestID: string;
    readonly debtSettlementTestID: string;
}

export const TransactionMetadataRows = ({ transaction, refundedPillTestID, feeTestID, debtSettlementTestID }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeEntry = feeEntries.at(0);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));
    const hasFee = isPositiveNumber(feeAmount);
    const feeCurrencySymbol = isDefined(feeEntry) ? feeEntry.account.instrument.symbol : '';
    const formattedFeeAmount = formatDigits(feeAmount, feeCurrencySymbol);
    const feeLabel = t`Fee · ${formattedFeeAmount}`;
    const debtSettlementAccountTitle = transaction.debtEvents.at(0)?.[DebtEventAssociationEnum.DEBT_ACCOUNT].title ?? null;
    const hasDebtSettlement = isDefined(debtSettlementAccountTitle);
    const isRefundTransaction = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;

    if (!isRefundTransaction && !hasFee && !hasDebtSettlement) {
        return null;
    }

    return (
        <View className="gap-y-xxs">
            <RefundedPill
                key={`${transaction.id}-${transaction.consolidationType}`}
                transaction={transaction}
                testID={refundedPillTestID}
            />

            {hasFee ? <TransactionMetadataRow label={feeLabel} testID={feeTestID} /> : null}

            <DebtSettlementPill accountTitle={debtSettlementAccountTitle} testID={debtSettlementTestID} />
        </View>
    );
};
