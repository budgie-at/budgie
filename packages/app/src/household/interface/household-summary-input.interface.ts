import type { HouseholdJoinStatusEnum } from '@budgie/cloud-sync';

export interface HouseholdSummaryInputInterface {
    readonly joinStatus: HouseholdJoinStatusEnum;
    readonly ownerDisplayName: string | null;
    readonly organizerName: string | null;
    readonly isMember: boolean;
    readonly isAvailable: boolean;
    readonly isReady: boolean;
    readonly sharedCount: number;
}
