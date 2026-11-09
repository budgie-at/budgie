import { UserIconNameEnum, isExpenseTransaction, isIncomeTransaction } from '@budgie/contracts';
import { TransactionDebtSettlementService, getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useAttachDebtSelector } from '../../../account/hook/use-attach-debt-selector.hook';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListAttachDebtMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const openAttachDebtSelector = useAttachDebtSelector();
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    if (
        isDefined(transaction.consolidationType) ||
        isDefined(transaction.consolidationParentTransactionId) ||
        (!isExpenseTransaction(transaction) && !isIncomeTransaction(transaction)) ||
        categoryEntries.length !== 1 ||
        isDefined(transaction.debtEvents.at(0))
    ) {
        return null;
    }

    const [categoryEntry] = categoryEntries;
    const borrowedIncome = isIncomeTransaction(transaction)
        ? {
              transactionId: transaction.id,
              title: transaction.title,
              amount: categoryEntry.amount,
              instrumentSymbol: categoryEntry.account.instrument.symbol
          }
        : null;

    const handlePress = (): void =>
        void openAttachDebtSelector(borrowedIncome, categoryEntry.accountId, debtAccountId =>
            appRuntime.runFork(
                logAndContinue(
                    Effect.flatMap(TransactionDebtSettlementService, transactionDebtSettlementService =>
                        transactionDebtSettlementService.attachMany([transaction.id], debtAccountId)
                    ).pipe(toastOnFailure(t`Could not attach debt`))
                )
            )
        );

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.HandCoins}
            label={t`Attach debt`}
            onPress={handlePress}
            testID={TransactionListContextMenuSelector.AttachDebtSettlementButton}
        />
    );
};
