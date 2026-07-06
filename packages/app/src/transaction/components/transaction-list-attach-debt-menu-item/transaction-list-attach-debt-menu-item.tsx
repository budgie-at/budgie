import { AccountDebtTypeEnum, AccountTypeEnum, UserIconNameEnum, isExpenseTransaction, isIncomeTransaction } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { accountDebtOpeningService } from '../../../account/service/account-debt-opening.service';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { transactionDebtSettlementService } from '../../service/transaction-debt-settlement.service';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { getTransactionDebtSettlementEntries } from '../../utils/get-transaction-debt-settlement-entries.util';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { AccountSelectorCreateActionInterface } from '../../../account/interface/account-selector-create-action.interface';

export const TransactionListAttachDebtMenuItem = () => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { transaction, closeMenu } = useTransactionListContextMenu();
    const [openAccountSelector] = useAccountSelectorModal();
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const isVisible =
        !isDefined(transaction.consolidationType) &&
        !isDefined(transaction.consolidationParentTransactionId) &&
        (isExpenseTransaction(transaction) || isIncomeTransaction(transaction)) &&
        categoryEntries.length === 1 &&
        !isDefined(getTransactionDebtSettlementEntries(transaction.entries).at(0));

    if (!isVisible) {
        return null;
    }

    const [categoryEntry] = categoryEntries;
    const debtAttachmentErrorMessage = t`Could not attach debt`;

    const createBorrowedDebtAccount = async () => {
        await accountDebtOpeningService.createBorrowedDebtFromIncome(
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
            transaction.id
        );
    };

    const borrowedDebtCreateAction: AccountSelectorCreateActionInterface | null = isIncomeTransaction(transaction)
        ? {
              title: t`New borrowed debt`,
              subtitle: `${t`Total borrowed`}: ${formatDigits(convertFromMicroUnits(categoryEntry.amount), categoryEntry.account.instrument.symbol)}`,
              errorMessage: debtAttachmentErrorMessage,
              onCreate: createBorrowedDebtAccount
          }
        : null;

    const handleAttach = () => {
        closeMenu(() => {
            openAccountSelector({
                includeAccountTypes: [AccountTypeEnum.DEBT],
                excludeAccountId: categoryEntry.accountId,
                emptyStateDescription: t`Create a debt account first.`,
                showDebtTotal: true,
                ...(isDefined(borrowedDebtCreateAction) && { createAction: borrowedDebtCreateAction })
            })
                .then(async debtAccountId => {
                    if (isDefined(debtAccountId)) {
                        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId });
                    }

                    return null;
                })
                .catch(() => void Toast.show({ type: 'error', text1: debtAttachmentErrorMessage }));
        });
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
