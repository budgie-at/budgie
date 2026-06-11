import { TransactionConsolidationTypeEnum, TransactionEntryKindEnum, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { getTransactionFeeEntries } from '../../utils/get-transaction-fee-entries.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { TransactionMetadataRow } from '../transaction-metadata-row/transaction-metadata-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly refundedPillTestID: string;
    readonly feeTestID: string;
    readonly debtSettlementTestID: string;
}

const getDebtSettlementLabel = (transactionType: TransactionTypeEnum, accountTitle: string | null) => {
    if (!isDefined(accountTitle)) {
        return null;
    }

    if (transactionType === TransactionTypeEnum.INCOME) {
        return t`Debt return · ${accountTitle}`;
    }

    if (transactionType === TransactionTypeEnum.EXPENSE) {
        return t`Debt repayment · ${accountTitle}`;
    }

    return t`Debt · ${accountTitle}`;
};

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
    const debtSettlementEntry = transaction.entries.find(entry => entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);
    const debtSettlementLabel = getDebtSettlementLabel(
        transaction.type,
        isDefined(debtSettlementEntry) ? debtSettlementEntry.account.title : null
    );
    const isRefundTransaction = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;

    if (!isRefundTransaction && !hasFee && !isDefined(debtSettlementLabel)) {
        return null;
    }

    return (
        <View className="gap-y-xxs">
            <RefundedPill transaction={transaction} testID={refundedPillTestID} />

            {hasFee ? <TransactionMetadataRow icon={UserIconNameEnum.ReceiptText} label={feeLabel} testID={feeTestID} /> : null}

            {isDefined(debtSettlementLabel) ? (
                <TransactionMetadataRow icon={UserIconNameEnum.HandCoins} label={debtSettlementLabel} testID={debtSettlementTestID} />
            ) : null}
        </View>
    );
};
