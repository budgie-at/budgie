import type { HouseholdJoinStatusEnum } from '@budgie/cloud-sync';

export interface HouseholdJoinInterface {
    readonly status: HouseholdJoinStatusEnum;
    readonly ownerDisplayName: string | null;
}
