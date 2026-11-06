import type { InzhurPlannedActionInterface } from './inzhur-planned-action.interface';

export interface InzhurQuantityResolutionInputInterface {
    readonly actions: readonly InzhurPlannedActionInterface[];
    readonly baseMicroUnitsByFund: ReadonlyMap<string, number>;
    readonly priceByExternalId: ReadonlyMap<string, number>;
}
