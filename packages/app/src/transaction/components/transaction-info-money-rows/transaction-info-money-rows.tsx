import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
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
    const exchangeRate = getTransactionInfoExchangeRate(transaction, formatRate, formatDigits);
    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));
    const feeDisplay = formatDigits(feeAmount, feeEntries.at(0)?.account.instrument.symbol ?? '');

    return (
        <>
            {isDefined(exchangeRate) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.ArrowRightLeft}
                    label={t`Exchange rate`}
                    value={exchangeRate.label}
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
