import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { getTransactionInfoExchangeRate } from '../../utils/get-transaction-info-exchange-rate.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoMoneyRows = ({ transaction }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
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
                    description={exchangeRate.description}
                    testID={TransactionInfoPageSelector.Row.ExchangeRate}
                />
            ) : null}

            {isPositiveNumber(feeAmount) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Banknote}
                    label={t`Fee`}
                    value={feeDisplay}
                    testID={TransactionInfoPageSelector.Row.Fee}
                />
            ) : null}
        </>
    );
};
