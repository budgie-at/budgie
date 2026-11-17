import { DebtEventAssociationEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useContext } from 'react';

import { isDefined } from '@rnw-community/shared';

import { isSecurityInstrumentType } from '../../../instrument/utils/is-security-instrument-type.util';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { StatisticsCategoryIdsContext } from '../../context/statistics-category-ids.context';
import { getSecurityTrade } from '../../utils/get-security-trade.util';
import { resolveTransactionAmountEntries } from '../../utils/resolve-transaction-amount-entries.util';
import { selectStatisticsAmountTransaction } from '../../utils/select-statistics-amount-transaction.util';
import { ConvertedAmountLabel } from '../converted-amount-label/converted-amount-label';
import { DebtSettlementConvertedAmountLabel } from '../debt-settlement-converted-amount-label/debt-settlement-converted-amount-label';
import { TransactionTransferSecondaryAmount } from '../transaction-transfer-secondary-amount/transaction-transfer-secondary-amount';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionSecondaryAmount = ({ transaction: fullTransaction, accountId }: Props) => {
    const statisticsCategoryIds = useContext(StatisticsCategoryIdsContext);
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);

    const transaction = selectStatisticsAmountTransaction(fullTransaction, statisticsCategoryIds);
    const { fromEntry, toEntry } = resolveTransactionAmountEntries(transaction, accountId);

    if (isDefined(fromEntry) && isDefined(toEntry)) {
        return isDefined(getSecurityTrade(transaction)) ? null : (
            <TransactionTransferSecondaryAmount fromEntry={fromEntry} toEntry={toEntry} accountId={accountId} />
        );
    }

    const sideEntry = fromEntry ?? toEntry;

    if (!isDefined(sideEntry) || isSecurityInstrumentType(sideEntry.account.instrument.type)) {
        return null;
    }

    const debtEvent = transaction.debtEvents.at(0);

    if (isDefined(debtEvent) && debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument.id !== sideEntry.account.instrument.id) {
        return <DebtSettlementConvertedAmountLabel debtEvent={debtEvent} />;
    }

    return sideEntry.account.instrument.id === defaultInstrumentId ? null : (
        <ConvertedAmountLabel instrumentId={sideEntry.account.instrument.id} amount={sideEntry.amount} baseAmount={sideEntry.baseAmount} />
    );
};
