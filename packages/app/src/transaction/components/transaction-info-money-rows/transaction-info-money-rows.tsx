import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { getTransactionFeeEntries } from '../../utils/get-transaction-fee-entries.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionInfoMoneyRowsPropsInterface } from '../../interface/transaction-info-money-rows-props.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const getFeeDisplay = (transaction: TransactionWithRelationsEntityInterface, formatDigits: (value: number, symbol?: string) => string) => {
    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));
    const feeCurrencySymbol = feeEntries.at(0)?.account.instrument.symbol ?? '';

    return isPositiveNumber(feeAmount) ? formatDigits(feeAmount, feeCurrencySymbol) : null;
};

const getTransferDestinationAmount = (
    transaction: TransactionWithRelationsEntityInterface,
    formatDigits: (value: number, symbol?: string) => string
): string | null => {
    const destinationEntry = transaction.entries.find(entry => entry.accountId === transaction.toAccountId);

    if (!isDefined(destinationEntry)) {
        return null;
    }

    return formatDigits(convertFromMicroUnits(destinationEntry.amount), destinationEntry.account.instrument.symbol);
};

const getTransferExchangeRateLabel = (
    transaction: TransactionWithRelationsEntityInterface,
    formatRate: (value: number, symbol?: string) => string
): string | null => {
    const sourceEntry = transaction.entries.find(entry => entry.accountId === transaction.fromAccountId);
    const destinationEntry = transaction.entries.find(entry => entry.accountId === transaction.toAccountId);

    if (!isDefined(sourceEntry) || !isDefined(destinationEntry)) {
        return null;
    }

    return `1 ${sourceEntry.account.instrument.code} = ${formatRate(transaction.exchangeRate)} ${destinationEntry.account.instrument.code}`;
};

export const TransactionInfoMoneyRows = ({ transaction }: TransactionInfoMoneyRowsPropsInterface) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const formatRate = useFormatDigits(0, 4);
    const feeDisplay = getFeeDisplay(transaction, formatDigits);
    const transferDestinationAmount = getTransferDestinationAmount(transaction, formatDigits);
    const transferExchangeRateLabel = getTransferExchangeRateLabel(transaction, formatRate);
    const showTransferConversion = transaction.type === TransactionTypeEnum.TRANSFER && isNotEmptyString(transferExchangeRateLabel);

    return (
        <>
            {showTransferConversion ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.ArrowRightLeft}
                    label={t`Exchange rate`}
                    value={transferExchangeRateLabel}
                    description={transferDestinationAmount}
                    testID={TransactionInfoPageSelector.Row.ExchangeRate}
                />
            ) : null}

            {isNotEmptyString(feeDisplay) ? (
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
