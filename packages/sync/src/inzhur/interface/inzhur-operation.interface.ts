import type { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

export interface InzhurOperationInterface {
    readonly externalId: string;
    readonly kind: InzhurOperationKindEnum;
    readonly occurredAt: Date;
    readonly fundName: string | null;
    readonly quantity: number | null;
    readonly debit: number;
    readonly credit: number;
}
