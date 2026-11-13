import { YieldKindEnum, normalizeYieldFields } from '@budgie/contracts';

import type { TransactionTypeEnum } from '@budgie/contracts';

export const buildYieldKindOptions = (type: TransactionTypeEnum): readonly YieldKindEnum[] =>
    Object.values(YieldKindEnum).filter(kind => normalizeYieldFields(type, kind, null).yieldKind === kind);
