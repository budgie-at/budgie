import type { HomeHoldingInterface } from './home-holding.interface';
import type { InstitutionGroupInterface } from './institution-group.interface';
import type { AccountTypeEnum } from '@budgie/contracts';

export interface HomeHoldingSectionInterface {
    readonly type: AccountTypeEnum;
    readonly total: number;
    readonly holdings: readonly HomeHoldingInterface[];
    readonly returnHoldings: readonly HomeHoldingInterface[];
    readonly cashProviders: readonly InstitutionGroupInterface[];
}
