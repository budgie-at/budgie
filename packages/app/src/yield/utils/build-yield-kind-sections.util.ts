import { YieldKindEnum, normalizeYieldFields } from '@budgie/contracts';
import { YIELD_GROUP_BY_KIND, YieldGroupEnum } from '@budgie/market';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';

import type { TransactionTypeEnum } from '@budgie/contracts';

const GROUP_ORDER: readonly YieldGroupEnum[] = [...YIELD_STACK_GROUPS, YieldGroupEnum.TAX];

export const buildYieldKindSections = (type: TransactionTypeEnum): readonly (readonly YieldKindEnum[])[] => {
    const kinds = Object.values(YieldKindEnum).filter(kind => normalizeYieldFields(type, kind, null).yieldKind === kind);
    const passiveKinds = GROUP_ORDER.flatMap(group => kinds.filter(kind => YIELD_GROUP_BY_KIND[kind] === group));
    const notPassiveKinds = kinds.filter(kind => !isDefined(YIELD_GROUP_BY_KIND[kind]));

    return [passiveKinds, notPassiveKinds].filter(isNotEmptyArray);
};
