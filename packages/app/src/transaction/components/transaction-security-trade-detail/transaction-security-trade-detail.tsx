import { TransactionEntryTypeEnum, convertFromMicroUnits } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { ListRowDetail } from '../../../@generic/component/list-row-detail/list-row-detail';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { isSecurityInstrumentType } from '../../../instrument/utils/is-security-instrument-type.util';
import { useTransactionFeeLabel } from '../../hook/use-transaction-fee-label.hook';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionSecurityTradeDetail = ({ transaction }: Props) => {
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const feeLabel = useTransactionFeeLabel(transaction);

    const securityEntries = transaction.entries.filter(entry => isSecurityInstrumentType(entry.account.instrument.type));
    const cashEntries = transaction.entries.filter(
        entry => !isSecurityInstrumentType(entry.account.instrument.type) && entry.type !== TransactionEntryTypeEnum.FEE
    );
    const security = securityEntries.at(0)?.account.instrument;
    const isBuy = securityEntries.at(0)?.accountId === transaction.toAccountId;
    const cash = formatInstrumentAmount(
        convertFromMicroUnits(sumEntryAmounts(cashEntries)),
        cashEntries.at(0)?.account.instrument.symbol ?? '',
        null
    );
    const quantity = formatInstrumentAmount(
        convertFromMicroUnits(sumEntryAmounts(securityEntries)),
        security?.symbol ?? '',
        security?.type ?? null
    );
    const trade = isBuy ? `${cash} → +${quantity}` : `−${quantity} → ${cash}`;

    return <ListRowDetail segments={[trade, feeLabel].filter(isNotEmptyString)} />;
};
