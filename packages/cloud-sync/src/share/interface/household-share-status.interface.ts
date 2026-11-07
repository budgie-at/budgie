import type { HouseholdShareStateEnum } from '../enum/household-share-state.enum';

export interface HouseholdShareStatusInterface {
    readonly isAvailable: boolean;
    readonly state: HouseholdShareStateEnum;
}
