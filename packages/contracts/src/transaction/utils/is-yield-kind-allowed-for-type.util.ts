import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { YieldKindEnum } from '../enum/yield-kind.enum';

const YIELD_KINDS_BY_TYPE: Partial<Record<TransactionTypeEnum, ReadonlySet<YieldKindEnum>>> = {
    [TransactionTypeEnum.INCOME]: new Set(Object.values(YieldKindEnum).filter(kind => kind !== YieldKindEnum.TAX)),
    [TransactionTypeEnum.EXPENSE]: new Set([YieldKindEnum.TAX, YieldKindEnum.NONE])
};

export const isYieldKindAllowedForType = (type: TransactionTypeEnum, yieldKind: YieldKindEnum): boolean =>
    YIELD_KINDS_BY_TYPE[type]?.has(yieldKind) ?? false;
