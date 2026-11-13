import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ListRowDetail } from '../../../@generic/component/list-row-detail/list-row-detail';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { useTransactionFeeLabel } from '../../hook/use-transaction-fee-label.hook';
import { getSecurityTrade } from '../../utils/get-security-trade.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionSecurityTradeDetail = ({ transaction }: Props) => {
    const { t } = useLingui();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const feeLabel = useTransactionFeeLabel(transaction);
    const trade = getSecurityTrade(transaction);

    if (!isDefined(trade)) {
        return null;
    }

    const { securityEntry, cashInstrument } = trade;
    const quantity = formatInstrumentAmount(
        convertFromMicroUnits(trade.quantity),
        securityEntry.account.instrument.symbol,
        securityEntry.account.instrument.type
    );
    const unitPrice = isDefined(securityEntry.quotedUnitPrice)
        ? formatInstrumentAmount(convertFromMicroUnits(securityEntry.quotedUnitPrice), cashInstrument.symbol, cashInstrument.type)
        : null;
    const position = isDefined(unitPrice) ? t`${quantity} @ ${unitPrice}` : quantity;

    return <ListRowDetail segments={[position, feeLabel].filter(isNotEmptyString)} />;
};
