import { logAndContinue } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { YIELD_POSITION_ACCOUNT_TYPES } from '../../yield/constant/yield-position-account-types.constant';
import { findYieldLandingAccount } from '../utils/find-yield-landing-account.util';

import type { TransactionCreateEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useEditTransactionYield = (transaction: TransactionWithRelationsEntityInterface) => {
    const { t } = useLingui();
    const openKindSelector = useOpenModal('/yield-kind');
    const openAccountSelector = useOpenModal('/account-selector');
    const { accounts } = useSearchAccountsSortedQuery('', { includeTypes: [...YIELD_POSITION_ACCOUNT_TYPES], onlyActive: true });

    const landingZone = findYieldLandingAccount(transaction)?.syncZone;
    const hasSourceCandidates = isNotEmptyArray(accounts.filter(account => account.syncZone === landingZone));

    const save = (patch: Partial<Pick<TransactionCreateEntityInterface, 'yieldKind' | 'yieldSourceAccountId'>>) =>
        void appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(TransactionService, service => service.updateYield(transaction.id, patch)).pipe(
                    toastOnFailure(t`Could not save the change.`)
                )
            )
        );

    const openKindPicker = () =>
        void openKindSelector({ transactionType: transaction.type, selectedKind: transaction.yieldKind }, kind => {
            if (isDefined(kind)) {
                save({ yieldKind: kind });
            }
        });

    const openSourcePicker = () =>
        void openAccountSelector(
            {
                initialAccountId: transaction.yieldSourceAccountId,
                includeAccountTypes: [...YIELD_POSITION_ACCOUNT_TYPES],
                onlyActive: true,
                ...(isDefined(landingZone) && { syncZone: landingZone })
            },
            accountId => {
                if (isDefined(accountId)) {
                    save({ yieldSourceAccountId: accountId });
                }
            }
        );

    return { openKindPicker, openSourcePicker, hasSourceCandidates };
};
