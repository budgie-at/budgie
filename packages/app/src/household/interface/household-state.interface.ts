import type { HouseholdRoleEnum } from '@budgie/cloud-sync';

export interface HouseholdStateInterface {
    readonly role: HouseholdRoleEnum;
    readonly isReady: boolean;
}
