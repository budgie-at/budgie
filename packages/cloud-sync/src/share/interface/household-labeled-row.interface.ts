import type { HouseholdRowIdentityInterface } from './household-row-identity.interface';

export interface HouseholdLabeledRowInterface extends HouseholdRowIdentityInterface {
    readonly parentId: number | null;
    readonly isDefault: number;
    readonly title: string;
}
