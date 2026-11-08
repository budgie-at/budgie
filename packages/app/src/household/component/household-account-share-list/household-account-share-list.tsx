import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { householdAccountsOverviewAtom } from '../../constant/household-accounts-overview-atom.constant';
import { householdShareEverythingAtom } from '../../constant/household-share-everything-atom.constant';
import { HouseholdAccountShareRow } from '../household-account-share-row/household-account-share-row';

export const HouseholdAccountShareList = () => {
    const overview = AsyncResult.getOrElse(useLiveAtomValue(householdAccountsOverviewAtom), () => null);
    const everything = AsyncResult.getOrElse(useLiveAtomValue(householdShareEverythingAtom), () => null);

    if (!isDefined(overview) || (isDefined(everything) && everything.isEnabled)) {
        return null;
    }

    return overview.mine.map(account => <HouseholdAccountShareRow key={account.id} account={account} />);
};
