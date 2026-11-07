import type { HouseholdJoinStatusEnum } from '../enum/household-join-status.enum';

export interface HouseholdJoinInterface {
    readonly status: HouseholdJoinStatusEnum;
    readonly ownerDisplayName: string | null;
}
