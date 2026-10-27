import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    UserIconNameEnum,
    isExpenseTransaction,
    isIncomeTransaction,
    convertFromMicroUnits
} from '@budgie/contracts';
import { AccountDebtOpeningService, TransactionDebtSettlementService, getTransactionCategoryEntries } from '@budgie/ledger';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { getDebtOpeningMessages } from '../../../account/utils/get-debt-opening-messages.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { AccountSelectorCreateActionInterface } from '../../../account/interface/account-selector-create-action.interface';

export const TransactionListAttachDebtMenuItem = () => {
    const { t } = useLingui();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);
    const { transaction, closeMenu } = useTransactionListContextMenu();
    const [openAccountSelector] = useAccountSelectorModal();
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
    const debtAttachmentErrorMessage = t`Could not attach debt`;

    const createBorrowedDebtAccount = async (): Promise<number | null> => {
        await appRuntime.runPromise(
            Effect.flatMap(AccountDebtOpeningService, accountDebtOpeningService =>
                accountDebtOpeningService.createBorrowedDebtFromIncome(
                    {
                        title: isNotEmptyString(transaction.title) ? transaction.title : t`Borrowed`,
                        iban: null,
                        icon: UserIconNameEnum.HandCoins,
                        instrumentId: categoryEntry.account.instrumentId,
                        type: AccountTypeEnum.DEBT,
                        debtType: AccountDebtTypeEnum.BORROW,
                        currentBalance: 0,
                        targetBalance: convertFromMicroUnits(categoryEntry.amount),
                        contactId: null,
                        deadline: null
                    },
                    transaction.id,
                    getDebtOpeningMessages()
                )
            )
        );

        return null;
    };

    const borrowedDebtCreateAction: AccountSelectorCreateActionInterface | null = isIncomeTransaction(transaction)
        ? {
              title: t`New borrowed debt`,
              subtitle: `${t`Total borrowed`}: ${formatDigits(convertFromMicroUnits(categoryEntry.amount), categoryEntry.account.instrument.symbol)}`,
              errorMessage: debtAttachmentErrorMessage,
              onCreate: createBorrowedDebtAccount
          }
        : null;

    const attachDebtToTransaction = () => {
        openAccountSelector(
            {
                includeAccountTypes: [AccountTypeEnum.DEBT],
                excludeAccountId: categoryEntry.accountId,
                emptyStateDescription: t`Create a debt account first.`,
                showDebtTotal: true,
                ...(isDefined(borrowedDebtCreateAction) && { createAction: borrowedDebtCreateAction })
            },
            debtAccountId => {
                if (isDefined(debtAccountId)) {
                    appRuntime
                        .runPromise(
                            Effect.flatMap(TransactionDebtSettlementService, transactionDebtSettlementService =>
                                transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId })
                            )
                        )
                        .catch(() => {
                            Toast.show({ type: 'error', text1: debtAttachmentErrorMessage });
                        });
                }
            }
        );
    };

    const handleAttach = () => {
        closeMenu(attachDebtToTransaction);
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.HandCoins}
            label={t`Attach debt`}
            onPress={handleAttach}
            testID={TransactionListContextMenuSelector.AttachDebtSettlementButton}
        />
    );
};
