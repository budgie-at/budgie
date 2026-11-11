import type { HouseholdAccountShareEntryInterface } from './household-account-share-entry.interface';

export interface HouseholdAccountShareGroupInterface extends Pick<HouseholdAccountShareEntryInterface, 'type' | 'integration'> {
    readonly key: string;
    readonly groupNumber: number | null;
    readonly accounts: readonly HouseholdAccountShareEntryInterface[];
}
