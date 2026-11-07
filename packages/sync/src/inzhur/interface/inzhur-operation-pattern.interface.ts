import type { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

export interface InzhurOperationPatternInterface {
    readonly kind: InzhurOperationKindEnum;
    readonly pattern: RegExp;
    readonly isIncoming: boolean | null;
    readonly needsFund: boolean;
}
