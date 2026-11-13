import { YieldGroupEnum, YieldRangeEnum } from '@budgie/market';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { YieldScreenKeyInterface } from '../interface/yield-screen-key.interface';
import type { YieldScreenParamsInterface } from '../interface/yield-screen-params.interface';

const SELECTABLE_GROUPS: readonly YieldGroupEnum[] = [
    YieldGroupEnum.STAKING_EARN,
    YieldGroupEnum.INTEREST,
    YieldGroupEnum.DIVIDENDS,
    YieldGroupEnum.DISTRIBUTIONS
];
const FROM_PATTERN = /^(account|instrument)-\d+$/u;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

const isValidDay = (value: string | undefined): value is string => isDefined(value) && DAY_PATTERN.test(value);

const toPositiveId = (value: string | undefined) => {
    const id = Number(value);

    return Number.isInteger(id) && isPositiveNumber(id) ? id : null;
};

const toRange = (value: string | undefined, fallback: YieldRangeEnum) =>
    Object.values(YieldRangeEnum).find(range => range === value) ?? fallback;

const toGroup = (value: string | undefined) => SELECTABLE_GROUPS.find(group => group === value) ?? null;

export const toYieldKey = (
    params: YieldScreenParamsInterface,
    sessionRange: YieldRangeEnum,
    baseInstrumentId: number
): YieldScreenKeyInterface => {
    const positionAccountId = toPositiveId(params.position);
    const instrumentId = isDefined(positionAccountId) ? null : toPositiveId(params.instrument);
    const accountScope = isDefined(positionAccountId) ? `account-${positionAccountId}` : null;
    const instrumentScope = isDefined(instrumentId) ? `instrument-${instrumentId}` : null;

    return {
        key: {
            range: toRange(params.range, sessionRange),
            positionAccountId,
            instrumentId,
            group: toGroup(params.group),
            baseInstrumentId
        },
        focusDay: isValidDay(params.focus) ? params.focus : null,
        from: isDefined(params.from) && FROM_PATTERN.test(params.from) ? params.from : null,
        scopeId: accountScope ?? instrumentScope,
        period: isValidDay(params.periodFrom) && isValidDay(params.periodTo) ? { fromDay: params.periodFrom, toDay: params.periodTo } : null
    };
};
