import { InstrumentTypeEnum, TransactionTypeEnum, YieldKindEnum, YieldRepository, convertFromMicroUnits } from '@budgie/contracts';
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
import { YIELD_WINDOW_DAYS } from '../constant/yield-window-days.constant';
import { YieldBucketUnitEnum } from '../enum/yield-bucket-unit.enum';
import { YieldDeltaKindEnum } from '../enum/yield-delta-kind.enum';
import { YieldGroupEnum } from '../enum/yield-group.enum';
import { YieldPositionSectionEnum } from '../enum/yield-position-section.enum';
import { YieldRangeEnum } from '../enum/yield-range.enum';
import { countYieldDays } from '../utils/count-yield-days.util';
import { formatYieldDay } from '../utils/format-yield-day.util';
import { isYieldEstimated } from '../utils/is-yield-estimated.util';
import { sumNumbers } from '../utils/sum-numbers.util';
import { sumYieldValues } from '../utils/sum-yield-values.util';
import { toYieldPriceDay } from '../utils/to-yield-price-day.util';

import { YieldHoldingService } from './yield-holding.service';
import { YieldPriceService } from './yield-price.service';

import type { YieldBucketInterface } from '../interface/yield-bucket.interface';
import type { YieldCryptoRewardsInterface } from '../interface/yield-crypto-rewards.interface';
import type { YieldDeltaInterface } from '../interface/yield-delta.interface';
import type { YieldEstimateCauseInterface } from '../interface/yield-estimate-cause.interface';
import type { YieldEstimatedFigureInterface } from '../interface/yield-estimated-figure.interface';
import type { YieldFactInterface } from '../interface/yield-fact.interface';
import type { YieldGroupAmountsType } from '../interface/yield-group-amounts.type';
import type { YieldPositionContextInterface } from '../interface/yield-position-context.interface';
import type { YieldPositionSummaryInterface } from '../interface/yield-position-summary.interface';
import type { YieldQueryKeyInterface } from '../interface/yield-query-key.interface';
import type { YieldSummaryInterface } from '../interface/yield-summary.interface';
import type { YieldWindowInterface } from '../interface/yield-window.interface';
import type { Db, DbError, LanguageEnum, YieldFactRowInterface, YieldScopeInterface } from '@budgie/contracts';

export class YieldService extends Context.Service<YieldService>()('@budgie/market/YieldService', {
    make: Effect.gen(function* () {
        const yieldRepository = yield* YieldRepository;
        const yieldPriceService = yield* YieldPriceService;
        const yieldHoldingService = yield* YieldHoldingService;

        const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
        const ESTIMATE_CAUSE_LIMIT = 5;
        const ALL_MAX_MONTHS = 36;
        const ALL_MAX_QUARTERS = 40;
        const ALL_SCOPE: YieldScopeInterface = { positionAccountId: null, instrumentId: null };
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
                day: formatYieldDay(row.operatedAt),
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
                startDay: formatYieldDay(origin),
                spans: Array.from({ length: count }, (_, index) => {
                    const start = BUCKET_STEP[unit](origin, index);

                    return { start, end: BUCKET_STEP[unit](start, 1) };
                })
            };
        };

        const groupByBucket = (window: YieldWindowInterface, facts: readonly YieldFactInterface[], origin: Date) => {
            const indexByDay = new Map<string, number>();

            return facts.reduce((byIndex, fact) => {
                const index = indexByDay.get(fact.day) ?? BUCKET_DIFFERENCE[window.unit](parseISO(fact.day), origin);
                const bucketFacts = byIndex.get(index) ?? [];

                indexByDay.set(fact.day, index);
                bucketFacts.push(fact);

                return byIndex.set(index, bucketFacts);
            }, new Map<number, YieldFactInterface[]>());
        };

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
                    start: formatYieldDay(span.start),
                    end: isInProgress ? todayDay : formatYieldDay(subDays(span.end, 1)),
                    isInProgress,
                    amounts: sumByGroup(bucketFacts),
                    estimatedAmounts: sumByGroup(bucketFacts.filter(fact => fact.isEstimated)),
                    total: sumYieldValues(counted),
                    isEstimated: isYieldEstimated(counted)
                };
            });
        };

        const buildPriorTotals = (window: YieldWindowInterface, income: readonly YieldFactInterface[], todayDay: string) => {
            const count = window.spans.length;
            const lastSpan = window.spans.at(-1);
            const priorOrigin = BUCKET_STEP[window.unit](window.origin, -count);
            const priorLastStart = BUCKET_STEP[window.unit](priorOrigin, count - 1);
            const elapsedShare = isDefined(lastSpan)
                ? countYieldDays(formatYieldDay(lastSpan.start), todayDay) / differenceInCalendarDays(lastSpan.end, lastSpan.start)
                : 1;
            const priorLastDays = differenceInCalendarDays(BUCKET_STEP[window.unit](priorLastStart, 1), priorLastStart);
            const cutDay = formatYieldDay(addDays(priorLastStart, Math.round(elapsedShare * priorLastDays)));
            const priorStartDay = formatYieldDay(priorOrigin);
            const byIndex = groupByBucket(
                window,
                income.filter(fact => fact.day >= priorStartDay && fact.day < cutDay),
                priorOrigin
            );

            return window.spans.map((_, index) => sumYieldValues(byIndex.get(index) ?? []));
        };

        const buildDelta = (earned: number, priorTotals: readonly number[] | null): YieldDeltaInterface | null => {
            const prior = sumNumbers(priorTotals ?? []);

            if (!isDefined(priorTotals) || (prior === 0 && earned === 0)) {
                return null;
            }

            return prior === 0
                ? { kind: YieldDeltaKindEnum.NEW, ratio: null }
                : { kind: YieldDeltaKindEnum.CHANGE, ratio: (earned - prior) / prior };
        };

        const summarizePosition = (
            context: YieldPositionContextInterface,
            isInWindow: (fact: YieldFactInterface) => boolean
        ): YieldPositionSummaryInterface => {
            const { row, holdings, positionYield } = context;
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
                earned: sumYieldValues(income),
                isEarnedEstimated: isYieldEstimated(income),
                rewardUnits: sumNumbers(income.filter(fact => fact.landingInstrumentId === row.instrumentId).map(fact => fact.units)),
                tax: Math.abs(sumYieldValues(windowFacts.filter(fact => !isIncome(fact)))),
                annualYield: { rate: positionYield.rate, reason: positionYield.reason, isEstimated: positionYield.isEstimated },
                accruing: context.accruing?.value ?? null,
                isAccruingEstimated: context.accruing?.isEstimated ?? false,
                interestRate: row.interestRate,
                deadline: isDefined(row.deadline) ? formatYieldDay(row.deadline) : null,
                vsRate: context.vsRate
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
            const value = sumNumbers(parts.map(part => part.value));
            const cryptoRewards: YieldCryptoRewardsInterface = {
                value,
                arrivalValue: sumYieldValues(rewards),
                isEstimated: parts.some(part => part.isPriceMissing) || isYieldEstimated(parts)
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
                    .at(0) ?? toYieldPriceDay(todayDay);
            const loadedSeries = yield* Effect.forEach(
                [...new Map(estimated.map(fact => [fact.landingInstrumentId, fact])).values()],
                fact =>
                    Effect.map(
                        yieldPriceService.loadSeries(
                            { id: fact.landingInstrumentId, code: fact.landingInstrumentCode, type: fact.landingInstrumentType },
                            baseInstrumentId,
                            fromDay,
                            toYieldPriceDay(todayDay)
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
                const todayDay = formatYieldDay(today);
                const scope = { positionAccountId: key.positionAccountId, instrumentId: key.instrumentId };
                const facts = (yield* yieldRepository.findFacts(scope, key.baseInstrumentId)).map(toFact);
                const incomeFacts = facts.filter(isIncome);
                const firstYieldDay = incomeFacts.at(0)?.day ?? null;
                const window = buildWindow(key.range, today, firstYieldDay);
                const yieldWindowStart = formatYieldDay(subDays(today, YIELD_WINDOW_DAYS - 1));
                const isInWindow = (fact: YieldFactInterface) => fact.day >= window.startDay && fact.day <= todayDay;
                const matchesGroup = (fact: YieldFactInterface) => !isDefined(key.group) || fact.group === key.group;
                const producingIds = new Set(incomeFacts.filter(fact => fact.group === key.group).map(fact => fact.positionAccountId));
                const scopedTax = facts.filter(
                    fact => !isIncome(fact) && (!isDefined(key.group) || producingIds.has(fact.positionAccountId))
                );
                const rangeIncome = incomeFacts.filter(fact => isInWindow(fact) && matchesGroup(fact));
                const allRangeIncome = incomeFacts.filter(isInWindow);
                const earned = sumYieldValues(rangeIncome);
                const allEarned = sumYieldValues(allRangeIncome);
                const tax = Math.abs(sumYieldValues(scopedTax.filter(isInWindow)));
                const priorTotals =
                    key.range === YieldRangeEnum.ALL ? null : buildPriorTotals(window, incomeFacts.filter(matchesGroup), todayDay);
                const contexts = yield* yieldHoldingService.loadContexts(facts, scope, key.baseInstrumentId, todayDay);
                const positions = contexts
                    .map(context => summarizePosition(context, isInWindow))
                    .sort((left, right) => SECTION_ORDER[left.section] - SECTION_ORDER[right.section] || right.earned - left.earned);
                const summary: YieldSummaryInterface = {
                    hasYield: isNotEmptyArray(facts),
                    windowStart: window.startDay,
                    today: todayDay,
                    bucketUnit: window.unit,
                    buckets: buildBuckets(window, [...allRangeIncome, ...scopedTax.filter(isInWindow)], matchesGroup, todayDay),
                    priorTotals,
                    earned: { value: earned, isEstimated: isYieldEstimated(rangeIncome) },
                    payoutCount: rangeIncome.length,
                    tax,
                    net: earned - tax,
                    share: isDefined(key.group) && isPositiveNumber(allEarned) ? earned / allEarned : null,
                    delta: buildDelta(earned, priorTotals),
                    annualYield: yieldHoldingService.combineYield(
                        contexts,
                        incomeFacts.some(fact => fact.kind === YieldKindEnum.DISTRIBUTION && fact.day >= yieldWindowStart)
                    ),
                    runRate: yieldHoldingService.runRate(contexts),
                    cryptoRewardsToday: yield* computeCryptoRewardsToday(rangeIncome, key.baseInstrumentId),
                    vsRate: isDefined(key.positionAccountId)
                        ? (positions.find(position => position.accountId === key.positionAccountId)?.vsRate ?? null)
                        : null,
                    groups: STACK_GROUPS.filter(group => incomeFacts.some(fact => fact.group === group)).map(group => ({
                        group,
                        total: sumYieldValues(allRangeIncome.filter(fact => fact.group === group))
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
                const figure: YieldEstimatedFigureInterface = { value: sumYieldValues(facts), isEstimated: isYieldEstimated(facts) };

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
        Layer.provide([YieldRepository.layer, YieldPriceService.layer, YieldHoldingService.layer])
    );
}
