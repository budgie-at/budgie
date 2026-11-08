import type { HouseholdAccountShareEntryInterface } from './household-account-share-entry.interface';

export interface HouseholdAccountsOverviewInterface {
    readonly mine: readonly HouseholdAccountShareEntryInterface[];
    readonly sharedByOthersCount: number;
}
