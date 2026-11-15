import { YIELD_POSITION_ACCOUNT_TYPES } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { isSelectableAccount } from '../../account/utils/is-selectable-account.util';
import { findYieldLandingAccount } from '../utils/find-yield-landing-account.util';

import { useOpenYieldKindPicker } from './use-open-yield-kind-picker.hook';
import { useSaveTransactionYield } from './use-save-transaction-yield.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useEditTransactionYield = (transaction: TransactionWithRelationsEntityInterface) => {
    const openAccountSelector = useOpenModal('/account-selector');
    const openKindPicker = useOpenYieldKindPicker(transaction);
    const save = useSaveTransactionYield(transaction.id);
    const { accounts } = useSearchAccountsSortedQuery('', { includeTypes: [...YIELD_POSITION_ACCOUNT_TYPES], onlyActive: true });

    const landingZone = findYieldLandingAccount(transaction)?.syncZone;
    const hasSourceCandidates = isNotEmptyArray(
        accounts.filter(account => isSelectableAccount(account, transaction.yieldSourceAccountId, landingZone))
    );

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
