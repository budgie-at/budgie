import type { YieldKindEnum } from '../enum/yield-kind.enum';

export interface YieldFieldsInterface<Source = number> {
    readonly yieldKind: YieldKindEnum | null;
    readonly yieldSourceAccountId: Source | null;
}
