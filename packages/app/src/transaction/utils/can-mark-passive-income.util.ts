import { YieldKindEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { buildYieldKindOptions } from '../../yield/utils/build-yield-kind-options.util';

import type { TransactionTypeEnum } from '@budgie/contracts';

export const canMarkPassiveIncome = (type: TransactionTypeEnum, yieldKind: YieldKindEnum | null): boolean =>
    (!isDefined(yieldKind) || yieldKind === YieldKindEnum.NONE) &&
    buildYieldKindOptions(type).some(kind => kind !== YieldKindEnum.NONE && kind !== YieldKindEnum.TAX);
