import { AccountTypeEnum, TransactionEntryKindEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';
import { accountService } from '../../account/service/account.service';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';
import { getTransactionDebtSettlementEntries } from '../utils/get-transaction-debt-settlement-entries.util';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import type { DebtSettlementTransactionActionsParamsInterface } from '../interface/debt-settlement-transaction-actions-params.interface';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export const useDebtSettlementTransactionActions = ({
    form,
    transaction,
    transactionAccountId,
    debtType,
    emptyStateDescription,
    attachErrorMessage
}: DebtSettlementTransactionActionsParamsInterface) => {
    const [openAccountSelector] = useAccountSelectorModal();
    const { control, getValues, setValue } = form;
    const entries = useWatch({ control, name: 'entries' });
    const transactionDebtSettlementEntry = getTransactionDebtSettlementEntries(transaction.entries).at(0);
    const transactionDebtSettlementAccountTitle = transactionDebtSettlementEntry?.account.title ?? null;
    const [localDebtSettlementState, setLocalDebtSettlementState] = useState<{
        readonly accountTitle: string | null;
    } | null>(null);
    const debtSettlementEntry = getTransactionDebtSettlementEntries(entries).at(0);
    const hasDebtSettlement = isDefined(debtSettlementEntry);
    const debtSettlementAccountTitle = hasDebtSettlement
        ? (localDebtSettlementState?.accountTitle ?? transactionDebtSettlementAccountTitle)
        : null;

    const buildDebtSettlementEntry = (debtAccountId: number): TransactionEntryCreateInputInterface | null => {
        const currentEntries = getValues('entries');
        const categoryEntries = getTransactionCategoryEntries(currentEntries);
        const categoryEntry = categoryEntries.at(0);

        if (!isDefined(categoryEntry)) {
            return null;
        }

        return {
            accountId: debtAccountId,
            categoryId: categoryEntry.categoryId,
            categorySource: categoryEntry.categorySource,
            mccCategoryId: categoryEntry.mccCategoryId,
            type: transaction.type === TransactionTypeEnum.INCOME ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
            amount: sumEntryAmounts(categoryEntries),
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: null,
            baseExchangeRate: null,
            baseAmount: null,
            toIban: null,
            originalTransactionId: null
        };
    };

    const updateDebtSettlementEntry = (entry: TransactionEntryCreateInputInterface, accountTitle: string) => {
        const currentEntries = getValues('entries');
        const entriesWithoutDebtSettlement = currentEntries.filter(item => item.kind !== TransactionEntryKindEnum.DEBT_SETTLEMENT);

        setValue('entries', [...entriesWithoutDebtSettlement, entry], { shouldDirty: true, shouldValidate: false });
        setLocalDebtSettlementState({ accountTitle });
    };

    const handleOpenDebtSettlement = () =>
        void openAccountSelector({
            includeAccountTypes: [AccountTypeEnum.DEBT],
            excludeAccountId: transactionAccountId ?? 0,
            ...(isDefined(debtType) && { debtType }),
            emptyStateDescription
        })
            .then(async debtAccountId => {
                if (isDefined(debtAccountId)) {
                    const debtAccount = await accountService.findByIdOrFail(debtAccountId);
                    const debtSettlementEntry = buildDebtSettlementEntry(debtAccountId);

                    if (isDefined(debtSettlementEntry)) {
                        updateDebtSettlementEntry(debtSettlementEntry, debtAccount.title);
                    }
                }

                return null;
            })
            .catch(() => void Toast.show({ type: 'error', text1: attachErrorMessage }));

    const handleDetachDebtSettlement = () => {
        const currentEntries = getValues('entries');
        const entriesWithoutDebtSettlement = currentEntries.filter(item => item.kind !== TransactionEntryKindEnum.DEBT_SETTLEMENT);

        setValue('entries', entriesWithoutDebtSettlement, { shouldDirty: true, shouldValidate: false });
        setLocalDebtSettlementState({ accountTitle: null });
    };

    return {
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        hasDebtSettlement,
        debtSettlementAccountTitle
    };
};
