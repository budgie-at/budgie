import type { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

export interface InzhurOperationIdPartsInterface {
    readonly seconds: number;
    readonly kind: InzhurOperationKindEnum;
    readonly fundKey: string;
    readonly amountMicroUnits: number;
    readonly ordinal: number;
}
