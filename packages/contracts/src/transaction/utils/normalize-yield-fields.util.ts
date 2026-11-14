import { isDefined } from '@rnw-community/shared';

import { YieldKindEnum } from '../enum/yield-kind.enum';

import { isYieldKindAllowedForType } from './is-yield-kind-allowed-for-type.util';

import type { TransactionTypeEnum } from '../enum/transaction-type.enum';
import type { YieldFieldsInterface } from '../interface/yield-fields.interface';

export const normalizeYieldFields = <Source>(
    type: TransactionTypeEnum,
    yieldKind: YieldKindEnum | null,
    yieldSourceAccountId: Source | null
): YieldFieldsInterface<Source> => {
    const allowedKind = isDefined(yieldKind) && isYieldKindAllowedForType(type, yieldKind) ? yieldKind : null;

    return {
        yieldKind: allowedKind,
        yieldSourceAccountId: isDefined(allowedKind) && allowedKind !== YieldKindEnum.NONE ? yieldSourceAccountId : null
    };
};
