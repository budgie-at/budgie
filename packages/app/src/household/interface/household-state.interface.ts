import type { HouseholdRoleEnum } from '../enum/household-role.enum';

export interface HouseholdStateInterface {
    readonly role: HouseholdRoleEnum;
    readonly isReady: boolean;
}
