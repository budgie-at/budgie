import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { getSecurityTrade } from '../../utils/get-security-trade.util';
import { getTransactionInfoExchangeRate } from '../../utils/get-transaction-info-exchange-rate.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly onFeePress: () => void;
}

export const TransactionInfoMoneyRows = ({ transaction, onFeePress }: Props) => {
    const { t } = useLingui();
    const formatDigits = useProtectedAmountLabel();
    const formatRate = useFormatDigits(0, 4);
    const formatPrice = useFormatDigits(2, 4);
    const trade = getSecurityTrade(transaction);
    const unitPrice = trade?.securityEntry.quotedUnitPrice;
    const rateRow = isDefined(trade)
        ? {
              icon: UserIconNameEnum.Tag,
              label: t`Price per share`,
              value: isDefined(unitPrice) ? formatPrice(convertFromMicroUnits(unitPrice), trade.cashInstrument.symbol) : null
          }
        : {
              icon: UserIconNameEnum.ArrowRightLeft,
              label: t`Exchange rate`,
              value: getTransactionInfoExchangeRate(transaction, formatRate)
          };
    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));
    const feeDisplay = formatDigits(feeAmount, feeEntries.at(0)?.account.instrument.symbol ?? '');

    return (
        <>
            {isDefined(rateRow.value) ? (
                <TransactionInfoRow
                    icon={rateRow.icon}
                    label={rateRow.label}
                    value={rateRow.value}
                    testID={TransactionInfoPageSelector.Row.ExchangeRate}
                />
            ) : null}

            {isPositiveNumber(feeAmount) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Banknote}
                    label={t`Fee`}
                    value={feeDisplay}
                    onPress={onFeePress}
                    testID={TransactionInfoPageSelector.Row.Fee}
                />
            ) : null}
        </>
    );
};
