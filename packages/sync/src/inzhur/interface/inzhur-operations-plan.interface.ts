import type { InzhurOperationInterface } from './inzhur-operation.interface';
import type { InzhurPlannedActionInterface } from './inzhur-planned-action.interface';

export interface InzhurOperationsPlanInterface {
    readonly actions: readonly InzhurPlannedActionInterface[];
    readonly orphanSurcharges: readonly InzhurOperationInterface[];
    readonly surchargeAmount: number;
    readonly firstAt: Date;
    readonly lastAt: Date;
    readonly isFullHistory: boolean;
    readonly cashTotal: number;
}
