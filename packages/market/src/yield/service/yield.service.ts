import {
    AccountTypeEnum,
    InstrumentTypeEnum,
    TransactionTypeEnum,
    YieldKindEnum,
    YieldRepository,
    convertFromMicroUnits
} from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { addMonths } from 'date-fns/addMonths';
import { addQuarters } from 'date-fns/addQuarters';
import { addWeeks } from 'date-fns/addWeeks';
import { addYears } from 'date-fns/addYears';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { differenceInCalendarMonths } from 'date-fns/differenceInCalendarMonths';
import { differenceInCalendarQuarters } from 'date-fns/differenceInCalendarQuarters';
import { differenceInCalendarWeeks } from 'date-fns/differenceInCalendarWeeks';
import { differenceInCalendarYears } from 'date-fns/differenceInCalendarYears';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import { startOfQuarter } from 'date-fns/startOfQuarter';
import { startOfWeek } from 'date-fns/startOfWeek';
import { startOfYear } from 'date-fns/startOfYear';
import { subDays } from 'date-fns/subDays';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { findLastIndexOnOrBefore } from '../../@generic/utils/find-last-index-on-or-before.util';
import { formatUtcDay } from '../../@generic/utils/format-utc-day.util';
import { YieldBucketUnitEnum } from '../enum/yield-bucket-unit.enum';
import { YieldDeltaKindEnum } from '../enum/yield-delta-kind.enum';
import { YieldGroupEnum } from '../enum/yield-group.enum';
import { YieldPositionSectionEnum } from '../enum/yield-position-section.enum';
import { YieldRangeEnum } from '../enum/yield-range.enum';
import { YieldUnavailableReasonEnum } from '../enum/yield-unavailable-reason.enum';

import { YieldPriceService } from './yield-price.service';

import type { YieldBucketInterface } from '../interface/yield-bucket.interface';
import type { YieldCombinedYieldInterface } from '../interface/yield-combined-yield.interface';
import type { YieldCryptoRewardsInterface } from '../interface/yield-crypto-rewards.interface';
import type { YieldDeltaInterface } from '../interface/yield-delta.interface';
import type { YieldEstimateCauseInterface } from '../interface/yield-estimate-cause.interface';
import type { YieldEstimatedFigureInterface } from '../interface/yield-estimated-figure.interface';
import type { YieldFactInterface } from '../interface/yield-fact.interface';
import type { YieldGroupAmountsType } from '../interface/yield-group-amounts.type';
import type { YieldHoldingsInterface } from '../interface/yield-holdings.interface';
import type { YieldMovementInterface } from '../interface/yield-movement.interface';
import type { YieldPositionContextInterface } from '../interface/yield-position-context.interface';
import type { YieldPositionInputInterface } from '../interface/yield-position-input.interface';
import type { YieldPositionSummaryInterface } from '../interface/yield-position-summary.interface';
import type { YieldPositionYieldInterface } from '../interface/yield-position-yield.interface';
import type { YieldPriceSeriesInterface } from '../interface/yield-price-series.interface';
import type { YieldQueryKeyInterface } from '../interface/yield-query-key.interface';
import type { YieldRateInterface } from '../interface/yield-rate.interface';
import type { YieldSummaryInterface } from '../interface/yield-summary.interface';
import type { YieldVsRateInterface } from '../interface/yield-vs-rate.interface';
import type { YieldWindowInterface } from '../interface/yield-window.interface';
import type {
    Db,
    DbError,
    LanguageEnum,
    YieldFactRowInterface,
    YieldPositionMovementRowInterface,
    YieldPositionRowInterface,
    YieldScopeInterface
} from '@budgie/contracts';

export class YieldService extends Context.Service<YieldService>()('@budgie/market/YieldService', {
    make: Effect.gen(function* () {
        const yieldRepository = yield* YieldRepository;
        const yieldPriceService = yield* YieldPriceService;

        const DAY_FORMAT = 'yyyy-MM-dd';
        const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
        const YIELD_WINDOW_DAYS = 365;
        const MIN_HISTORY_DAYS = 28;
        const MIN_LUMPY_PAYOUTS = 2;
        const ESTIMATE_SHARE = 0.05;
        const MAX_DROPPED_SHARE = 0.2;
        const MAX_RATE = 1;
        const COVERAGE_SHARE = 0.8;
        const PERCENT = 100;
        const ESTIMATE_CAUSE_LIMIT = 5;
        const ALL_MAX_MONTHS = 36;
        const ALL_MAX_QUARTERS = 40;
        const RATED_ACCOUNT_TYPES: ReadonlySet<AccountTypeEnum> = new Set([AccountTypeEnum.DEPOSIT, AccountTypeEnum.SAVINGS]);
        const ALL_SCOPE: YieldScopeInterface = { positionAccountId: null, instrumentId: null };
        const RATE_KINDS: ReadonlySet<YieldKindEnum> = new Set([
            YieldKindEnum.STAKING,
            YieldKindEnum.EARN,
            YieldKindEnum.DIVIDEND,
            YieldKindEnum.INTEREST
        ]);
        const LUMPY_KINDS: ReadonlySet<YieldKindEnum> = new Set([YieldKindEnum.DIVIDEND, YieldKindEnum.INTEREST]);
        const STACK_GROUPS: readonly YieldGroupEnum[] = [
            YieldGroupEnum.STAKING_EARN,
            YieldGroupEnum.INTEREST,
            YieldGroupEnum.DIVIDENDS,
            YieldGroupEnum.DISTRIBUTIONS
        ];
        const GROUP_BY_KIND: Readonly<Record<YieldKindEnum, YieldGroupEnum | null>> = {
            [YieldKindEnum.STAKING]: YieldGroupEnum.STAKING_EARN,
            [YieldKindEnum.EARN]: YieldGroupEnum.STAKING_EARN,
            [YieldKindEnum.INTEREST]: YieldGroupEnum.INTEREST,
            [YieldKindEnum.DIVIDEND]: YieldGroupEnum.DIVIDENDS,
            [YieldKindEnum.DISTRIBUTION]: YieldGroupEnum.DISTRIBUTIONS,
            [YieldKindEnum.TAX]: YieldGroupEnum.TAX,
            [YieldKindEnum.NONE]: null
        };
        const SECTION_ORDER: Readonly<Record<YieldPositionSectionEnum, number>> = {
            [YieldPositionSectionEnum.ACTIVE]: 0,
            [YieldPositionSectionEnum.CLOSED]: 1
        };
        const RANGE_UNIT: Readonly<Record<YieldRangeEnum, YieldBucketUnitEnum | null>> = {
            [YieldRangeEnum.MONTH]: YieldBucketUnitEnum.DAY,
            [YieldRangeEnum.QUARTER]: YieldBucketUnitEnum.WEEK,
            [YieldRangeEnum.YEAR]: YieldBucketUnitEnum.MONTH,
            [YieldRangeEnum.ALL]: null
        };
        const RANGE_COUNT: Readonly<Record<YieldRangeEnum, number>> = {
            [YieldRangeEnum.MONTH]: 30,
            [YieldRangeEnum.QUARTER]: 13,
            [YieldRangeEnum.YEAR]: 13,
            [YieldRangeEnum.ALL]: 0
        };
        const BUCKET_START: Readonly<Record<YieldBucketUnitEnum, (date: Date) => Date>> = {
            [YieldBucketUnitEnum.DAY]: date => startOfDay(date),
            [YieldBucketUnitEnum.WEEK]: date => startOfWeek(date, WEEK_OPTIONS),
            [YieldBucketUnitEnum.MONTH]: date => startOfMonth(date),
            [YieldBucketUnitEnum.QUARTER]: date => startOfQuarter(date),
            [YieldBucketUnitEnum.YEAR]: date => startOfYear(date)
        };
        const BUCKET_STEP: Readonly<Record<YieldBucketUnitEnum, (date: Date, amount: number) => Date>> = {
            [YieldBucketUnitEnum.DAY]: (date, amount) => addDays(date, amount),
            [YieldBucketUnitEnum.WEEK]: (date, amount) => addWeeks(date, amount),
            [YieldBucketUnitEnum.MONTH]: (date, amount) => addMonths(date, amount),
            [YieldBucketUnitEnum.QUARTER]: (date, amount) => addQuarters(date, amount),
            [YieldBucketUnitEnum.YEAR]: (date, amount) => addYears(date, amount)
        };
        const BUCKET_DIFFERENCE: Readonly<Record<YieldBucketUnitEnum, (later: Date, earlier: Date) => number>> = {
            [YieldBucketUnitEnum.DAY]: (later, earlier) => differenceInCalendarDays(later, earlier),
            [YieldBucketUnitEnum.WEEK]: (later, earlier) => differenceInCalendarWeeks(later, earlier, WEEK_OPTIONS),
            [YieldBucketUnitEnum.MONTH]: (later, earlier) => differenceInCalendarMonths(later, earlier),
            [YieldBucketUnitEnum.QUARTER]: (later, earlier) => differenceInCalendarQuarters(later, earlier),
            [YieldBucketUnitEnum.YEAR]: (later, earlier) => differenceInCalendarYears(later, earlier)
        };

        const toDay = (date: Date) => format(date, DAY_FORMAT);
        const toPriceDay = (day: string) => formatUtcDay(parseISO(`${day}T12:00:00`));
        const countDays = (fromDay: string, toDayKey: string) => differenceInCalendarDays(parseISO(toDayKey), parseISO(fromDay)) + 1;
        const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
        const sumValues = (facts: readonly YieldFactInterface[]) => sum(facts.map(fact => fact.value));
        const isShareEstimated = (estimated: number, total: number) => isPositiveNumber(total) && estimated / total >= ESTIMATE_SHARE;
        const isEstimatedTotal = (facts: readonly YieldFactInterface[]) =>
            isShareEstimated(sumValues(facts.filter(fact => fact.isEstimated)), sumValues(facts));
        const isIncome = (fact: YieldFactInterface) => fact.kind !== YieldKindEnum.TAX;
        const kindsOf = (group: YieldGroupEnum) => Object.values(YieldKindEnum).filter(kind => GROUP_BY_KIND[kind] === group);
        const buildEmptyAmounts = (): Record<YieldGroupEnum, number> => ({
            [YieldGroupEnum.STAKING_EARN]: 0,
            [YieldGroupEnum.INTEREST]: 0,
            [YieldGroupEnum.DIVIDENDS]: 0,
            [YieldGroupEnum.DISTRIBUTIONS]: 0,
            [YieldGroupEnum.TAX]: 0
        });

        const toFact = (row: YieldFactRowInterface): YieldFactInterface => {
            const sign = row.transactionType === TransactionTypeEnum.EXPENSE ? -1 : 1;

            return {
                kind: row.yieldKind,
                group: GROUP_BY_KIND[row.yieldKind],
                day: toDay(row.operatedAt),
                priceDay: formatUtcDay(row.operatedAt),
                units: sign * convertFromMicroUnits(row.amount),
                value: sign * convertFromMicroUnits(row.baseValue),
                isEstimated: row.isEstimated,
                landingInstrumentId: row.landingInstrumentId,
                landingInstrumentCode: row.landingInstrumentCode,
                landingInstrumentType: row.landingInstrumentType,
                positionAccountId: row.positionAccountId
            };
        };

        const toMovement = (row: YieldPositionMovementRowInterface): YieldMovementInterface => ({
            day: toDay(row.operatedAt),
            units: convertFromMicroUnits(row.amount)
        });

        const resolveAllUnit = (today: Date, firstDay: Date) => {
            if (differenceInCalendarMonths(today, firstDay) < ALL_MAX_MONTHS) {
                return YieldBucketUnitEnum.MONTH;
            }

            return differenceInCalendarQuarters(today, firstDay) < ALL_MAX_QUARTERS
                ? YieldBucketUnitEnum.QUARTER
                : YieldBucketUnitEnum.YEAR;
        };

        const buildWindow = (range: YieldRangeEnum, today: Date, firstYieldDay: string | null): YieldWindowInterface => {
            const firstDay = isDefined(firstYieldDay) ? parseISO(firstYieldDay) : today;
            const unit = RANGE_UNIT[range] ?? resolveAllUnit(today, firstDay);
            const lastStart = BUCKET_START[unit](today);
            const count =
                range === YieldRangeEnum.ALL
                    ? Math.max(BUCKET_DIFFERENCE[unit](lastStart, BUCKET_START[unit](firstDay)) + 1, 1)
                    : RANGE_COUNT[range];
            const origin = BUCKET_STEP[unit](lastStart, 1 - count);

            return {
                unit,
                origin,
                startDay: toDay(origin),
                spans: Array.from({ length: count }, (_, index) => {
                    const start = BUCKET_STEP[unit](origin, index);

                    return { start, end: BUCKET_STEP[unit](start, 1) };
                })
            };
        };

        const groupByBucket = (window: YieldWindowInterface, facts: readonly YieldFactInterface[], origin: Date) =>
            facts.reduce((byIndex, fact) => {
                const index = BUCKET_DIFFERENCE[window.unit](parseISO(fact.day), origin);
                const bucketFacts = byIndex.get(index) ?? [];

                bucketFacts.push(fact);

                return byIndex.set(index, bucketFacts);
            }, new Map<number, YieldFactInterface[]>());

        const sumByGroup = (facts: readonly YieldFactInterface[]): YieldGroupAmountsType => {
            const amounts = buildEmptyAmounts();

            facts.forEach(fact => {
                if (isDefined(fact.group)) {
                    amounts[fact.group] += Math.abs(fact.value);
                }
            });

            return amounts;
        };

        const buildBuckets = (
            window: YieldWindowInterface,
            windowFacts: readonly YieldFactInterface[],
            matchesGroup: (fact: YieldFactInterface) => boolean,
            todayDay: string
        ) => {
            const byIndex = groupByBucket(window, windowFacts, window.origin);

            return window.spans.map((span, index): YieldBucketInterface => {
                const bucketFacts = byIndex.get(index) ?? [];
                const counted = bucketFacts.filter(fact => isIncome(fact) && matchesGroup(fact));
                const isInProgress = index === window.spans.length - 1;

                return {
                    start: toDay(span.start),
                    end: isInProgress ? todayDay : toDay(subDays(span.end, 1)),
                    isInProgress,
                    amounts: sumByGroup(bucketFacts),
                    estimatedAmounts: sumByGroup(bucketFacts.filter(fact => fact.isEstimated)),
                    total: sumValues(counted),
                    isEstimated: isEstimatedTotal(counted)
                };
            });
        };

        const buildPriorTotals = (window: YieldWindowInterface, income: readonly YieldFactInterface[], todayDay: string) => {
            const count = window.spans.length;
            const lastSpan = window.spans.at(-1);
            const priorOrigin = BUCKET_STEP[window.unit](window.origin, -count);
            const priorLastStart = BUCKET_STEP[window.unit](priorOrigin, count - 1);
            const elapsedShare = isDefined(lastSpan)
                ? countDays(toDay(lastSpan.start), todayDay) / differenceInCalendarDays(lastSpan.end, lastSpan.start)
                : 1;
            const priorLastDays = differenceInCalendarDays(BUCKET_STEP[window.unit](priorLastStart, 1), priorLastStart);
            const cutDay = toDay(addDays(priorLastStart, Math.round(elapsedShare * priorLastDays)));
            const priorStartDay = toDay(priorOrigin);
            const byIndex = groupByBucket(
                window,
                income.filter(fact => fact.day >= priorStartDay && fact.day < cutDay),
                priorOrigin
            );

            return window.spans.map((_, index) => sumValues(byIndex.get(index) ?? []));
        };

        const buildDelta = (earned: number, priorTotals: readonly number[] | null): YieldDeltaInterface | null => {
            const prior = sum(priorTotals ?? []);

            if (!isDefined(priorTotals) || (prior === 0 && earned === 0)) {
                return null;
            }

            return prior === 0
                ? { kind: YieldDeltaKindEnum.NEW, ratio: null }
                : { kind: YieldDeltaKindEnum.CHANGE, ratio: (earned - prior) / prior };
        };

        const buildDailyUnits = (movements: readonly YieldMovementInterface[], fromDay: string, toDayKey: string) => {
            const deltas = movements
                .filter(movement => movement.day >= fromDay && movement.day <= toDayKey)
                .reduce(
                    (byDay, movement) => byDay.set(movement.day, (byDay.get(movement.day) ?? 0) + movement.units),
                    new Map<string, number>()
                );
            const origin = parseISO(fromDay);
            const daily: YieldMovementInterface[] = [];
            let units = sum(movements.filter(movement => movement.day < fromDay).map(movement => movement.units));

            for (let index = 0; index < countDays(fromDay, toDayKey); index += 1) {
                const day = toDay(addDays(origin, index));

                units += deltas.get(day) ?? 0;
                daily.push({ day, units });
            }

            return daily;
        };

        const trimToHeld = (daily: readonly YieldMovementInterface[]) => {
            let lastHeldIndex = -1;

            daily.forEach((entry, index) => {
                if (isPositiveNumber(entry.units)) {
                    lastHeldIndex = index;
                }
            });

            return daily.slice(0, lastHeldIndex + 1);
        };

        const computeHoldings = Effect.fnUntraced(function* (
            movements: readonly YieldMovementInterface[],
            series: YieldPriceSeriesInterface,
            fromDay: string,
            toDayKey: string
        ) {
            const firstInflowDay = movements.find(movement => isPositiveNumber(movement.units))?.day ?? null;
            const startDay = isDefined(firstInflowDay) && firstInflowDay > fromDay ? firstInflowDay : fromDay;
            const daily = buildDailyUnits(movements, fromDay, toDayKey);
            const held = trimToHeld(daily.filter(entry => entry.day >= startDay));
            const points = yield* Effect.forEach(held, ({ day, units }) =>
                Effect.map(yieldPriceService.resolve(series, toPriceDay(day)), point => ({ day, units, point }))
            );
            const droppedDays = new Set<string>();
            let unitSum = 0;
            let valueSum = 0;
            let estimatedValueSum = 0;
            let pricedDays = 0;

            points.forEach(({ day, units, point }) => {
                unitSum += units;

                if (point.isFarEstimated || !isDefined(point.price)) {
                    droppedDays.add(day);

                    return;
                }

                valueSum += units * point.price;
                pricedDays += 1;
                estimatedValueSum += point.isEstimated ? units * point.price : 0;
            });

            const holdings: YieldHoldingsInterface = {
                firstInflowDay,
                historyDays: isDefined(firstInflowDay) ? countDays(firstInflowDay, toDayKey) : 0,
                days: held.length,
                pricedDays,
                averageUnits: isPositiveNumber(held.length) ? unitSum / held.length : 0,
                averageValue: isPositiveNumber(pricedDays) ? valueSum / pricedDays : 0,
                estimatedAverageValue: isPositiveNumber(pricedDays) ? estimatedValueSum / pricedDays : 0,
                droppedShare: isPositiveNumber(held.length) ? droppedDays.size / held.length : 0,
                droppedDays,
                currentUnits: daily.at(-1)?.units ?? sum(movements.map(movement => movement.units))
            };

            return holdings;
        });

        const unavailable = (reason: YieldUnavailableReasonEnum | null): YieldRateInterface => ({
            rate: null,
            reason,
            isEstimated: false,
            rewardValue: 0,
            estimatedRewardValue: 0,
            annualisationDays: 0
        });

        const finishRate = (
            counted: readonly YieldFactInterface[],
            ratio: number,
            days: number,
            isEstimated: boolean
        ): YieldRateInterface => {
            const rate = (ratio * YIELD_WINDOW_DAYS) / days;

            return rate > MAX_RATE
                ? unavailable(YieldUnavailableReasonEnum.UNUSUALLY_HIGH)
                : {
                      rate,
                      reason: null,
                      isEstimated,
                      rewardValue: sumValues(counted),
                      estimatedRewardValue: sumValues(counted.filter(reward => reward.isEstimated)),
                      annualisationDays: days
                  };
        };

        const computeUnitYield = (rewards: readonly YieldFactInterface[], holdings: YieldHoldingsInterface) =>
            isPositiveNumber(holdings.averageUnits)
                ? finishRate(rewards, sum(rewards.map(reward => reward.units)) / holdings.averageUnits, holdings.days, false)
                : unavailable(YieldUnavailableReasonEnum.NO_AVERAGE);

        const computeValueYield = (
            rewards: readonly YieldFactInterface[],
            holdings: YieldHoldingsInterface,
            days: number
        ): YieldRateInterface => {
            if (holdings.droppedShare > MAX_DROPPED_SHARE) {
                return unavailable(YieldUnavailableReasonEnum.NOT_ENOUGH_PRICES);
            }

            if (!isPositiveNumber(holdings.averageValue)) {
                return unavailable(YieldUnavailableReasonEnum.NO_AVERAGE);
            }

            const kept = rewards.filter(reward => !holdings.droppedDays.has(reward.day));

            return finishRate(
                kept,
                sumValues(kept) / holdings.averageValue,
                days,
                isEstimatedTotal(kept) || isShareEstimated(holdings.estimatedAverageValue, holdings.averageValue)
            );
        };

        const computeLumpyYield = Effect.fnUntraced(function* (
            rewards: readonly YieldFactInterface[],
            instrumentId: number,
            holdingsBetween: (fromDay: string, toDayKey: string) => Effect.Effect<YieldHoldingsInterface, DbError, Db>
        ) {
            const first = rewards.at(0);
            const last = rewards.at(-1);
            const days = isDefined(first) && isDefined(last) ? differenceInCalendarDays(parseISO(last.day), parseISO(first.day)) : 0;

            if (rewards.length < MIN_LUMPY_PAYOUTS || !isDefined(first) || !isDefined(last) || !isPositiveNumber(days)) {
                return unavailable(YieldUnavailableReasonEnum.AWAITING_SECOND_PAYOUT);
            }

            const later = rewards.slice(1);
            const span = yield* holdingsBetween(first.day, last.day);

            if (rewards.every(reward => reward.landingInstrumentId === instrumentId)) {
                return isPositiveNumber(span.averageUnits)
                    ? finishRate(later, sum(later.map(reward => reward.units)) / span.averageUnits, days, false)
                    : unavailable(YieldUnavailableReasonEnum.NO_AVERAGE);
            }

            return computeValueYield(later, span, days - span.droppedDays.size);
        });

        const computeAnnualYield = Effect.fnUntraced(function* (
            row: YieldPositionRowInterface,
            holdings: YieldHoldingsInterface,
            rewards: readonly YieldFactInterface[],
            holdingsBetween: (fromDay: string, toDayKey: string) => Effect.Effect<YieldHoldingsInterface, DbError, Db>
        ) {
            if (!isNotEmptyArray([...rewards])) {
                return unavailable(null);
            }

            if (holdings.days < MIN_HISTORY_DAYS) {
                return unavailable(YieldUnavailableReasonEnum.UNDER_FOUR_WEEKS);
            }

            if (rewards.every(reward => LUMPY_KINDS.has(reward.kind)) && holdings.historyDays < YIELD_WINDOW_DAYS) {
                return yield* computeLumpyYield(rewards, row.instrumentId, holdingsBetween);
            }

            return rewards.every(reward => reward.landingInstrumentId === row.instrumentId)
                ? computeUnitYield(rewards, holdings)
                : computeValueYield(rewards, holdings, holdings.pricedDays);
        });

        const buildPositionContext = Effect.fnUntraced(function* (row: YieldPositionRowInterface, input: YieldPositionInputInterface) {
            const instrument = { id: row.instrumentId, code: row.instrumentCode, type: row.instrumentType };
            const series = yield* yieldPriceService.loadSeries(
                instrument,
                input.baseInstrumentId,
                toPriceDay(input.yieldWindowStart),
                toPriceDay(input.todayDay)
            );
            const latest = yield* yieldPriceService.findLatestPrice(instrument, input.baseInstrumentId);
            const holdings = yield* computeHoldings(input.movements, series, input.yieldWindowStart, input.todayDay);
            const rewards = input.facts.filter(
                fact => RATE_KINDS.has(fact.kind) && fact.day >= input.yieldWindowStart && fact.day <= input.todayDay
            );
            const annualYield = yield* computeAnnualYield(row, holdings, rewards, (fromDay, toDayKey) =>
                computeHoldings(input.movements, series, fromDay, toDayKey)
            );
            const positionYield: YieldPositionYieldInterface = {
                ...annualYield,
                averageValue: holdings.averageValue,
                estimatedAverageValue: holdings.estimatedAverageValue
            };
            const context: YieldPositionContextInterface = { row, facts: input.facts, holdings, positionYield, latest };

            return context;
        });

        const loadPositionContexts = Effect.fnUntraced(function* (
            facts: readonly YieldFactInterface[],
            scope: YieldScopeInterface,
            baseInstrumentId: number,
            todayDay: string
        ) {
            const positionIds = [...new Set(facts.map(fact => fact.positionAccountId).filter(isDefined))];
            const rows = yield* yieldRepository.findPositions(positionIds, scope);
            const movements = yield* yieldRepository.findPositionMovements(rows.map(row => row.id));
            const yieldWindowStart = toDay(subDays(parseISO(todayDay), YIELD_WINDOW_DAYS - 1));

            return yield* Effect.forEach(rows, row =>
                buildPositionContext(row, {
                    facts: facts.filter(fact => fact.positionAccountId === row.id),
                    movements: movements.filter(movement => movement.accountId === row.id).map(toMovement),
                    baseInstrumentId,
                    todayDay,
                    yieldWindowStart
                })
            );
        });

        const computeCombinedYield = (
            contexts: readonly YieldPositionContextInterface[],
            excludesDistributions: boolean
        ): YieldCombinedYieldInterface => {
            const holding = contexts.filter(context => isPositiveNumber(context.positionYield.averageValue));
            const yielding = holding.filter(context => isDefined(context.positionYield.rate));
            const totalValue = sum(holding.map(context => context.positionYield.averageValue));
            const coveredValue = sum(yielding.map(context => context.positionYield.averageValue));
            const counts = {
                holdingCount: yielding.length,
                totalCount: holding.length,
                isPartialCoverage: isPositiveNumber(totalValue) && coveredValue / totalValue < COVERAGE_SHARE,
                excludesDistributions
            };
            const [single] = contexts;

            if (contexts.length === 1 && isDefined(single)) {
                return {
                    ...counts,
                    rate: single.positionYield.rate,
                    reason: single.positionYield.reason,
                    isEstimated: single.positionYield.isEstimated
                };
            }

            if (!isNotEmptyArray(yielding)) {
                const unavailableReason =
                    contexts.map(context => context.positionYield.reason).find(isDefined) ??
                    (contexts.some(context => isDefined(context.positionYield.rate)) ? YieldUnavailableReasonEnum.NO_AVERAGE : null);

                return { ...counts, ...unavailable(unavailableReason) };
            }

            const annualised = (value: number, { positionYield }: YieldPositionContextInterface) =>
                (value * YIELD_WINDOW_DAYS) / positionYield.annualisationDays;
            const rewardValue = sum(yielding.map(context => annualised(context.positionYield.rewardValue, context)));
            const estimatedRewardValue = sum(yielding.map(context => annualised(context.positionYield.estimatedRewardValue, context)));
            const rate = rewardValue / coveredValue;

            return {
                ...counts,
                rate: rate > MAX_RATE ? null : rate,
                reason: rate > MAX_RATE ? YieldUnavailableReasonEnum.UNUSUALLY_HIGH : null,
                isEstimated:
                    rate <= MAX_RATE &&
                    (isShareEstimated(estimatedRewardValue, rewardValue) ||
                        isShareEstimated(sum(yielding.map(context => context.positionYield.estimatedAverageValue)), coveredValue))
            };
        };

        const computeRunRate = (contexts: readonly YieldPositionContextInterface[]): YieldEstimatedFigureInterface | null => {
            const parts = contexts.map(({ row, holdings, positionYield, latest }) => {
                const currentValue = holdings.currentUnits * (latest.price ?? 0);
                const interestRate = row.interestRate ?? 0;
                const isPriceMissing = !isDefined(latest.price);

                if (isDefined(positionYield.rate)) {
                    return {
                        value: positionYield.rate * currentValue,
                        isEstimated: positionYield.isEstimated || latest.isEstimated || isPriceMissing,
                        isPriceMissing
                    };
                }

                return RATED_ACCOUNT_TYPES.has(row.type) && isPositiveNumber(interestRate)
                    ? { value: (interestRate / PERCENT) * currentValue, isEstimated: latest.isEstimated || isPriceMissing, isPriceMissing }
                    : { value: 0, isEstimated: false, isPriceMissing: false };
            });
            const total = sum(parts.map(part => part.value));

            return isPositiveNumber(total)
                ? {
                      value: total,
                      isEstimated:
                          parts.some(part => part.isPriceMissing) ||
                          isShareEstimated(sum(parts.filter(part => part.isEstimated).map(part => part.value)), total)
                  }
                : null;
        };

        const computeAccruing = ({ row, holdings, latest, facts }: YieldPositionContextInterface, todayDay: string) => {
            const interestRate = row.interestRate ?? 0;
            const { firstInflowDay } = holdings;

            if (
                row.type !== AccountTypeEnum.DEPOSIT ||
                !isPositiveNumber(interestRate) ||
                !isDefined(firstInflowDay) ||
                facts.some(fact => fact.kind === YieldKindEnum.INTEREST)
            ) {
                return null;
            }

            const deadlineDay = isDefined(row.deadline) ? toDay(row.deadline) : todayDay;
            const endDay = deadlineDay < todayDay ? deadlineDay : todayDay;
            const days = Math.max(differenceInCalendarDays(parseISO(endDay), parseISO(firstInflowDay)), 0);

            return {
                value: ((holdings.currentUnits * interestRate) / PERCENT) * (days / YIELD_WINDOW_DAYS) * (latest.price ?? 0),
                isEstimated: latest.isEstimated || !isDefined(latest.price)
            };
        };

        const computeVsRate = ({ row, facts, positionYield }: YieldPositionContextInterface): YieldVsRateInterface | null => {
            const interestRate = row.interestRate ?? 0;

            return RATED_ACCOUNT_TYPES.has(row.type) &&
                isPositiveNumber(interestRate) &&
                facts.some(fact => fact.kind === YieldKindEnum.INTEREST)
                ? { actual: positionYield.rate, expected: interestRate / PERCENT }
                : null;
        };

        const summarizePosition = (
            context: YieldPositionContextInterface,
            isInWindow: (fact: YieldFactInterface) => boolean,
            todayDay: string
        ): YieldPositionSummaryInterface => {
            const { row, holdings, positionYield } = context;
            const accruing = computeAccruing(context, todayDay);
            const windowFacts = context.facts.filter(isInWindow);
            const income = windowFacts.filter(isIncome);
            const isOpen = row.isActive && !isDefined(row.deletedAt) && isPositiveNumber(holdings.currentUnits);

            return {
                accountId: row.id,
                title: row.title,
                accountType: row.type,
                instrumentCode: row.instrumentCode,
                instrumentSymbol: row.instrumentSymbol,
                instrumentType: row.instrumentType,
                section: isOpen ? YieldPositionSectionEnum.ACTIVE : YieldPositionSectionEnum.CLOSED,
                earned: sumValues(income),
                isEarnedEstimated: isEstimatedTotal(income),
                rewardUnits: sum(income.filter(fact => fact.landingInstrumentId === row.instrumentId).map(fact => fact.units)),
                tax: Math.abs(sumValues(windowFacts.filter(fact => !isIncome(fact)))),
                annualYield: { rate: positionYield.rate, reason: positionYield.reason, isEstimated: positionYield.isEstimated },
                accruing: accruing?.value ?? null,
                isAccruingEstimated: accruing?.isEstimated ?? false,
                interestRate: row.interestRate,
                deadline: isDefined(row.deadline) ? toDay(row.deadline) : null,
                vsRate: computeVsRate(context)
            };
        };

        const computeCryptoRewardsToday = Effect.fnUntraced(function* (
            rangeIncome: readonly YieldFactInterface[],
            baseInstrumentId: number
        ) {
            const rewards = rangeIncome.filter(
                fact => fact.landingInstrumentType === InstrumentTypeEnum.CRYPTO && fact.landingInstrumentId !== baseInstrumentId
            );

            if (!isNotEmptyArray(rewards)) {
                return null;
            }

            const instruments = new Map(rewards.map(fact => [fact.landingInstrumentId, fact.landingInstrumentCode]));
            const pricedInstruments = yield* Effect.forEach([...instruments], ([id, code]) =>
                Effect.map(
                    yieldPriceService.findLatestPrice({ id, code, type: InstrumentTypeEnum.CRYPTO }, baseInstrumentId),
                    latest => [id, latest] as const
                )
            );
            const prices = new Map(pricedInstruments);
            const parts = rewards.map(fact => {
                const latest = prices.get(fact.landingInstrumentId);

                return {
                    value: fact.units * (latest?.price ?? 0),
                    isEstimated: latest?.isEstimated ?? true,
                    isPriceMissing: !isDefined(latest?.price)
                };
            });
            const value = sum(parts.map(part => part.value));
            const cryptoRewards: YieldCryptoRewardsInterface = {
                value,
                arrivalValue: sumValues(rewards),
                isEstimated:
                    parts.some(part => part.isPriceMissing) ||
                    isShareEstimated(sum(parts.filter(part => part.isEstimated).map(part => part.value)), value)
            };

            return cryptoRewards;
        });

        const collectEstimateCauses = Effect.fnUntraced(function* (
            rangeIncome: readonly YieldFactInterface[],
            baseInstrumentId: number,
            todayDay: string
        ) {
            const estimated = [
                ...new Map(
                    rangeIncome.filter(fact => fact.isEstimated).map(fact => [`${fact.landingInstrumentId}:${fact.day}`, fact])
                ).values()
            ].slice(0, ESTIMATE_CAUSE_LIMIT);

            const fromDay =
                estimated
                    .map(fact => fact.priceDay)
                    .sort()
                    .at(0) ?? toPriceDay(todayDay);
            const loadedSeries = yield* Effect.forEach(
                [...new Map(estimated.map(fact => [fact.landingInstrumentId, fact])).values()],
                fact =>
                    Effect.map(
                        yieldPriceService.loadSeries(
                            { id: fact.landingInstrumentId, code: fact.landingInstrumentCode, type: fact.landingInstrumentType },
                            baseInstrumentId,
                            fromDay,
                            toPriceDay(todayDay)
                        ),
                        series => [fact.landingInstrumentId, series] as const
                    )
            );
            const seriesByInstrument = new Map(loadedSeries);

            return yield* Effect.forEach(estimated, (fact): Effect.Effect<YieldEstimateCauseInterface, DbError, Db> => {
                const series = seriesByInstrument.get(fact.landingInstrumentId);

                return isDefined(series)
                    ? Effect.map(yieldPriceService.resolve(series, fact.priceDay), point => {
                          const lastPricedIndex = findLastIndexOnOrBefore(series.days, fact.priceDay);

                          return {
                              instrumentCode: fact.landingInstrumentCode,
                              day: fact.day,
                              sourceDay: point.sourceDay ?? (lastPricedIndex < 0 ? null : series.days[lastPricedIndex])
                          };
                      })
                    : Effect.succeed({ instrumentCode: fact.landingInstrumentCode, day: fact.day, sourceDay: null });
            });
        });

        return {
            summarize: Effect.fn('YieldService.summarize')(function* (key: YieldQueryKeyInterface) {
                const now = yield* DateTime.nowAsDate;
                const today = startOfDay(now);
                const todayDay = toDay(today);
                const scope = { positionAccountId: key.positionAccountId, instrumentId: key.instrumentId };
                const facts = (yield* yieldRepository.findFacts(scope, key.baseInstrumentId)).map(toFact);
                const incomeFacts = facts.filter(isIncome);
                const firstYieldDay = incomeFacts.at(0)?.day ?? null;
                const window = buildWindow(key.range, today, firstYieldDay);
                const yieldWindowStart = toDay(subDays(today, YIELD_WINDOW_DAYS - 1));
                const isInWindow = (fact: YieldFactInterface) => fact.day >= window.startDay && fact.day <= todayDay;
                const matchesGroup = (fact: YieldFactInterface) => !isDefined(key.group) || fact.group === key.group;
                const producingIds = new Set(incomeFacts.filter(fact => fact.group === key.group).map(fact => fact.positionAccountId));
                const scopedTax = facts.filter(
                    fact => !isIncome(fact) && (!isDefined(key.group) || producingIds.has(fact.positionAccountId))
                );
                const rangeIncome = incomeFacts.filter(fact => isInWindow(fact) && matchesGroup(fact));
                const allRangeIncome = incomeFacts.filter(isInWindow);
                const earned = sumValues(rangeIncome);
                const allEarned = sumValues(allRangeIncome);
                const tax = Math.abs(sumValues(scopedTax.filter(isInWindow)));
                const priorTotals =
                    key.range === YieldRangeEnum.ALL ? null : buildPriorTotals(window, incomeFacts.filter(matchesGroup), todayDay);
                const contexts = yield* loadPositionContexts(facts, scope, key.baseInstrumentId, todayDay);
                const positions = contexts
                    .map(context => summarizePosition(context, isInWindow, todayDay))
                    .sort((left, right) => SECTION_ORDER[left.section] - SECTION_ORDER[right.section] || right.earned - left.earned);
                const summary: YieldSummaryInterface = {
                    hasYield: isNotEmptyArray(facts),
                    windowStart: window.startDay,
                    today: todayDay,
                    bucketUnit: window.unit,
                    buckets: buildBuckets(window, [...allRangeIncome, ...scopedTax.filter(isInWindow)], matchesGroup, todayDay),
                    priorTotals,
                    earned: { value: earned, isEstimated: isEstimatedTotal(rangeIncome) },
                    payoutCount: rangeIncome.length,
                    tax,
                    net: earned - tax,
                    share: isDefined(key.group) && isPositiveNumber(allEarned) ? earned / allEarned : null,
                    delta: buildDelta(earned, priorTotals),
                    annualYield: computeCombinedYield(
                        contexts,
                        incomeFacts.some(fact => fact.kind === YieldKindEnum.DISTRIBUTION && fact.day >= yieldWindowStart)
                    ),
                    runRate: computeRunRate(contexts),
                    cryptoRewardsToday: yield* computeCryptoRewardsToday(rangeIncome, key.baseInstrumentId),
                    vsRate: isDefined(key.positionAccountId)
                        ? (positions.find(position => position.accountId === key.positionAccountId)?.vsRate ?? null)
                        : null,
                    groups: STACK_GROUPS.filter(group => incomeFacts.some(fact => fact.group === group)).map(group => ({
                        group,
                        total: sumValues(allRangeIncome.filter(fact => fact.group === group))
                    })),
                    positions,
                    hasUnassigned: facts.some(fact => !isDefined(fact.positionAccountId)),
                    firstYieldDay,
                    lastPayoutDay: incomeFacts.at(-1)?.day ?? null,
                    estimateCauses: yield* collectEstimateCauses(rangeIncome, key.baseInstrumentId, todayDay),
                    instrumentIds: [
                        ...new Set([...facts.map(fact => fact.landingInstrumentId), ...contexts.map(context => context.row.instrumentId)])
                    ]
                };

                return summary;
            }),

            earnedBetween: Effect.fn('YieldService.earnedBetween')(function* (fromDay: string, lastDay: string, baseInstrumentId: number) {
                const facts = (yield* yieldRepository.findFacts(ALL_SCOPE, baseInstrumentId))
                    .map(toFact)
                    .filter(fact => isIncome(fact) && fact.day >= fromDay && fact.day <= lastDay);
                const figure: YieldEstimatedFigureInterface = { value: sumValues(facts), isEstimated: isEstimatedTotal(facts) };

                return figure;
            }),

            findPayouts: (key: YieldQueryKeyInterface, isUnassignedOnly: boolean, language: LanguageEnum, limit: number) =>
                yieldRepository.findPayouts({
                    scope: { positionAccountId: key.positionAccountId, instrumentId: key.instrumentId },
                    kinds: isDefined(key.group) ? kindsOf(key.group) : null,
                    isUnassignedOnly,
                    limit,
                    language
                })
        };
    })
}) {
    static readonly layer = Layer.effect(YieldService, YieldService.make).pipe(
        Layer.provide([YieldRepository.layer, YieldPriceService.layer])
    );
}
