import { TransactionEntryKindEnum, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountTitle?: string | null;
    readonly testID?: string;
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

export const DebtSettlementPill = ({ transaction, accountTitle = null, testID }: Props) => {
    const debtSettlementEntry = transaction.entries.find(entry => entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);
    const debtSettlementLabel = getDebtSettlementLabel(
        transaction.type,
        isDefined(debtSettlementEntry) ? debtSettlementEntry.account.title : accountTitle
    );

    if (!isDefined(debtSettlementLabel)) {
        return null;
    }

    return <TransactionMetaPill icon={UserIconNameEnum.HandCoins} label={debtSettlementLabel} testID={testID} variant="warning" />;
};
