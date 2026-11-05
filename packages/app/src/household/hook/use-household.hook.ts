import { useAtomValue } from '@effect/atom-react/Hooks';

import { householdStateAtom } from '../constant/household-state-atom.constant';
import { HouseholdRoleEnum } from '../enum/household-role.enum';

export const useHousehold = () => {
    const { role, isReady } = useAtomValue(householdStateAtom);

    return {
        role,
        isReady,
        isOwner: role === HouseholdRoleEnum.OWNER,
        isMember: role === HouseholdRoleEnum.MEMBER,
        isShared: role !== HouseholdRoleEnum.NONE
    };
};
