import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { householdAccountsOverviewAtom } from '../../constant/household-accounts-overview-atom.constant';
import { householdShareEverythingAtom } from '../../constant/household-share-everything-atom.constant';
import { groupHouseholdAccountShares } from '../../utils/group-household-account-shares.util';
import { HouseholdBankShareGroup } from '../household-bank-share-group/household-bank-share-group';
import { HouseholdTypeShareGroup } from '../household-type-share-group/household-type-share-group';

export const HouseholdAccountShareList = () => {
    const overview = AsyncResult.getOrElse(useLiveAtomValue(householdAccountsOverviewAtom), () => null);
    const everything = AsyncResult.getOrElse(useLiveAtomValue(householdShareEverythingAtom), () => null);

    if (!isDefined(overview) || (isDefined(everything) && everything.isEnabled)) {
        return null;
    }

    return groupHouseholdAccountShares(overview.mine).map(({ key, type, integration, groupNumber, accounts }) => {
        if (isDefined(integration)) {
            return (
                <HouseholdBankShareGroup key={key} groupKey={key} integration={integration} groupNumber={groupNumber} accounts={accounts} />
            );
        }

        return <HouseholdTypeShareGroup key={key} groupKey={key} type={type} accounts={accounts} />;
    });
};
