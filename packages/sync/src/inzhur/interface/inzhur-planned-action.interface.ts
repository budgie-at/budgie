import type { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

export interface InzhurPlannedActionInterface {
    readonly externalId: string;
    readonly kind: InzhurOperationKindEnum;
    readonly occurredAt: Date;
    readonly fundName: string | null;
    readonly cashAmount: number;
    readonly quantity: number | null;
    readonly isSellAll: boolean;
    readonly isConversion: boolean;
}
