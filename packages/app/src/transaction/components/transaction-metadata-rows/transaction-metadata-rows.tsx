import { DebtEventAssociationEnum, TransactionConsolidationTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { t } from '@lingui/core/macro';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { DebtSettlementPill } from '../debt-settlement-pill/debt-settlement-pill';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { TransactionMetadataRow } from '../transaction-metadata-row/transaction-metadata-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly refundedPillTestID: string;
    readonly receiptPillTestID: string;
    readonly feeTestID: string;
    readonly debtSettlementTestID: string;
}

export const TransactionMetadataRows = ({ transaction, refundedPillTestID, receiptPillTestID, feeTestID, debtSettlementTestID }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeEntry = feeEntries.at(0);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));
    const hasFee = isPositiveNumber(feeAmount);
    const feeCurrencySymbol = isDefined(feeEntry) ? feeEntry.account.instrument.symbol : '';
    const formattedFeeAmount = formatDigits(feeAmount, feeCurrencySymbol);
    const feeLabel = t`Fee · ${formattedFeeAmount}`;
    const debtSettlementAccount = transaction.debtEvents.at(0)?.[DebtEventAssociationEnum.DEBT_ACCOUNT] ?? null;
    const isRefundTransaction = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const hasReceipt = isDefined(transaction.receipt);

    if (!isRefundTransaction && !hasReceipt && !hasFee && !isDefined(debtSettlementAccount)) {
        return null;
    }

    return (
        <View className="gap-y-xxs">
            <RefundedPill
                key={`${transaction.id}-${transaction.consolidationType}`}
                transaction={transaction}
                testID={refundedPillTestID}
            />

            {hasReceipt ? <MetaPill icon={UserIconNameEnum.Receipt} label={t`Receipt`} testID={receiptPillTestID} /> : null}

            {hasFee ? <TransactionMetadataRow label={feeLabel} testID={feeTestID} /> : null}

            <DebtSettlementPill account={debtSettlementAccount} testID={debtSettlementTestID} />
        </View>
    );
};
