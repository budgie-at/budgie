import { HouseholdRoleEnum } from '@budgie/cloud-sync';
import { SyncZoneRoleEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { householdRegistryRoleAtom } from '../constant/household-registry-role-atom.constant';
import { householdStateAtom } from '../constant/household-state-atom.constant';

export const useHousehold = () => {
    const { role: engineRole, isReady } = useAtomValue(householdStateAtom);
    const registryRole = AsyncResult.getOrElse(useLiveAtomValue(householdRegistryRoleAtom), () => null);

    const registryHouseholdRole = registryRole === SyncZoneRoleEnum.OWNER ? HouseholdRoleEnum.OWNER : HouseholdRoleEnum.MEMBER;
    const role = isDefined(registryRole) ? registryHouseholdRole : engineRole;

    return {
        role,
        isReady,
        isOwner: role === HouseholdRoleEnum.OWNER,
        isMember: role === HouseholdRoleEnum.MEMBER,
        isShared: role !== HouseholdRoleEnum.NONE
    };
};
