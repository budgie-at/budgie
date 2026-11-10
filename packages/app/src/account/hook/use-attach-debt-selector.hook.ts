import { AccountDebtTypeEnum, AccountTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { AccountDebtOpeningService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useDisplayFormatDigits } from '../../i18n/hook/use-display-format-digits.hook';
import { getDebtOpeningMessages } from '../utils/get-debt-opening-messages.util';

import type { BorrowedDebtIncomeInterface } from '../interface/borrowed-debt-income.interface';

export const useAttachDebtSelector = () => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const openAccountSelector = useOpenModal('/account-selector');

    return (
        borrowedIncome: BorrowedDebtIncomeInterface | null,
        excludeAccountId: number | null,
        onSelect: (debtAccountId: number) => void
    ): void => {
        const createAction = isDefined(borrowedIncome)
            ? {
                  title: t`New borrowed debt`,
                  subtitle: `${t`Total borrowed`}: ${formatDigits(convertFromMicroUnits(borrowedIncome.amount), borrowedIncome.instrumentSymbol)}`,
                  errorMessage: t`Could not attach debt`,
                  onCreate: () =>
                      appRuntime.runPromise(
                          Effect.flatMap(AccountDebtOpeningService, accountDebtOpeningService =>
                              accountDebtOpeningService.createBorrowedDebtFromIncome(
                                  {
                                      title: isNotEmptyString(borrowedIncome.title) ? borrowedIncome.title : t`Borrowed`,
                                      iban: null,
                                      icon: UserIconNameEnum.HandCoins,
                                      type: AccountTypeEnum.DEBT,
                                      debtType: AccountDebtTypeEnum.BORROW,
                                      currentBalance: 0,
                                      targetBalance: convertFromMicroUnits(borrowedIncome.amount),
                                      contactId: null,
                                      deadline: null
                                  },
                                  borrowedIncome.transactionId,
                                  getDebtOpeningMessages()
                              )
                          ).pipe(Effect.map(account => account.id))
                      )
              }
            : null;

        openAccountSelector(
            {
                includeAccountTypes: [AccountTypeEnum.DEBT],
                excludeAccountId,
                emptyStateDescription: t`Create a debt account first.`,
                showDebtTotal: true,
                ...(isDefined(createAction) && { createAction })
            },
            debtAccountId => {
                if (isDefined(debtAccountId)) {
                    onSelect(debtAccountId);
                }
            }
        );
    };
};
