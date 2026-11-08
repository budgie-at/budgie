import { isBoolean, isNumber, isString } from '@rnw-community/shared';

import { SyncColumnKindEnum } from '../enum/sync-column-kind.enum';

import type { SyncWireValueType } from '../type/sync-wire-value.type';

export const SYNC_SCALAR_VALUE_NARROWERS: Readonly<
    Record<Exclude<SyncColumnKindEnum, SyncColumnKindEnum.TIMESTAMP>, (value: unknown) => SyncWireValueType | null>
> = {
    [SyncColumnKindEnum.BOOLEAN]: value => (isBoolean(value) ? value : null),
    [SyncColumnKindEnum.TEXT]: value => (isString(value) ? value : null),
    [SyncColumnKindEnum.INTEGER]: value => (isNumber(value) ? value : null),
    [SyncColumnKindEnum.REAL]: value => (isNumber(value) ? value : null)
};
