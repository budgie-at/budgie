import type { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

export interface InzhurRawOperationInterface {
    readonly index: number;
    readonly seconds: number;
    readonly kind: InzhurOperationKindEnum;
    readonly fundName: string | null;
    readonly quantity: number | null;
    readonly debit: number;
    readonly credit: number;
}
