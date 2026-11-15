import { AccountTypeEnum, YieldKindEnum, YieldRepository, convertFromMicroUnits } from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { YIELD_WINDOW_DAYS } from '../constant/yield-window-days.constant';
import { YieldUnavailableReasonEnum } from '../enum/yield-unavailable-reason.enum';
import { countYieldDays } from '../utils/count-yield-days.util';
import { formatYieldDay } from '../utils/format-yield-day.util';
import { isShareEstimated } from '../utils/is-share-estimated.util';
import { isYieldEstimated } from '../utils/is-yield-estimated.util';
import { sumNumbers } from '../utils/sum-numbers.util';
import { sumYieldValues } from '../utils/sum-yield-values.util';
import { toYieldPriceDay } from '../utils/to-yield-price-day.util';

import { YieldPriceService } from './yield-price.service';

import type { YieldCombinedYieldInterface } from '../interface/yield-combined-yield.interface';
import type { YieldEstimatedFigureInterface } from '../interface/yield-estimated-figure.interface';
import type { YieldFactInterface } from '../interface/yield-fact.interface';
import type { YieldHoldingsInterface } from '../interface/yield-holdings.interface';
import type { YieldMovementInterface } from '../interface/yield-movement.interface';
import type { YieldPositionContextInterface } from '../interface/yield-position-context.interface';
import type { YieldPositionInputInterface } from '../interface/yield-position-input.interface';
import type { YieldPositionYieldInterface } from '../interface/yield-position-yield.interface';
import type { YieldPriceSeriesInterface } from '../interface/yield-price-series.interface';
import type { YieldRateInterface } from '../interface/yield-rate.interface';
import type { YieldVsRateInterface } from '../interface/yield-vs-rate.interface';
import type { Db, DbError, YieldPositionMovementRowInterface, YieldPositionRowInterface, YieldScopeInterface } from '@budgie/contracts';

export class YieldHoldingService extends Context.Service<YieldHoldingService>()('@budgie/market/YieldHoldingService', {
    make: Effect.gen(function* () {
        const yieldRepository = yield* YieldRepository;
        const yieldPriceService = yield* YieldPriceService;

        const MIN_HISTORY_DAYS = 28;
        const MIN_LUMPY_PAYOUTS = 2;
        const MAX_DROPPED_SHARE = 0.2;
        const MAX_RATE = 1;
        const COVERAGE_SHARE = 0.8;
        const PERCENT = 100;
        const RATED_ACCOUNT_TYPES: ReadonlySet<AccountTypeEnum> = new Set([AccountTypeEnum.DEPOSIT, AccountTypeEnum.SAVINGS]);
        const RATE_KINDS: ReadonlySet<YieldKindEnum> = new Set([
            YieldKindEnum.STAKING,
            YieldKindEnum.EARN,
            YieldKindEnum.DIVIDEND,
            YieldKindEnum.INTEREST
        ]);
        const LUMPY_KINDS: ReadonlySet<YieldKindEnum> = new Set([YieldKindEnum.DIVIDEND, YieldKindEnum.INTEREST]);

        const toMovement = (row: YieldPositionMovementRowInterface): YieldMovementInterface => ({
            day: formatYieldDay(row.operatedAt),
            units: convertFromMicroUnits(row.amount)
        });

        const buildDailyUnits = (movements: readonly YieldMovementInterface[], fromDay: string, toDayKey: string) => {
            const deltas = movements
                .filter(movement => movement.day >= fromDay && movement.day <= toDayKey)
                .reduce(
                    (byDay, movement) => byDay.set(movement.day, (byDay.get(movement.day) ?? 0) + movement.units),
                    new Map<string, number>()
                );
            const origin = parseISO(fromDay);
            const daily: YieldMovementInterface[] = [];
            let units = sumNumbers(movements.filter(movement => movement.day < fromDay).map(movement => movement.units));

            for (let index = 0; index < countYieldDays(fromDay, toDayKey); index += 1) {
                const day = formatYieldDay(addDays(origin, index));

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
                Effect.map(yieldPriceService.resolve(series, toYieldPriceDay(day)), point => ({ day, units, point }))
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
                historyDays: isDefined(firstInflowDay) ? countYieldDays(firstInflowDay, toDayKey) : 0,
                days: held.length,
                pricedDays,
                averageUnits: isPositiveNumber(held.length) ? unitSum / held.length : 0,
                averageValue: isPositiveNumber(pricedDays) ? valueSum / pricedDays : 0,
                estimatedAverageValue: isPositiveNumber(pricedDays) ? estimatedValueSum / pricedDays : 0,
                droppedShare: isPositiveNumber(held.length) ? droppedDays.size / held.length : 0,
                droppedDays,
                currentUnits: daily.at(-1)?.units ?? sumNumbers(movements.map(movement => movement.units))
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
                      rewardValue: sumYieldValues(counted),
                      estimatedRewardValue: sumYieldValues(counted.filter(reward => reward.isEstimated)),
                      annualisationDays: days
                  };
        };

        const computeUnitYield = (rewards: readonly YieldFactInterface[], holdings: YieldHoldingsInterface) =>
            isPositiveNumber(holdings.averageUnits)
                ? finishRate(rewards, sumNumbers(rewards.map(reward => reward.units)) / holdings.averageUnits, holdings.days, false)
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
                sumYieldValues(kept) / holdings.averageValue,
                days,
                isYieldEstimated(kept) || isShareEstimated(holdings.estimatedAverageValue, holdings.averageValue)
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
                    ? finishRate(later, sumNumbers(later.map(reward => reward.units)) / span.averageUnits, days, false)
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

        const computeAccruing = (
            { row, holdings, latest, facts }: Pick<YieldPositionContextInterface, 'facts' | 'holdings' | 'latest' | 'row'>,
            todayDay: string
        ) => {
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

            const deadlineDay = isDefined(row.deadline) ? formatYieldDay(row.deadline) : todayDay;
            const endDay = deadlineDay < todayDay ? deadlineDay : todayDay;
            const days = Math.max(differenceInCalendarDays(parseISO(endDay), parseISO(firstInflowDay)), 0);

            return {
                value: ((holdings.currentUnits * interestRate) / PERCENT) * (days / YIELD_WINDOW_DAYS) * (latest.price ?? 0),
                isEstimated: latest.isEstimated || !isDefined(latest.price)
            };
        };

        const computeVsRate = (
            row: YieldPositionRowInterface,
            facts: readonly YieldFactInterface[],
            positionYield: YieldPositionYieldInterface
        ): YieldVsRateInterface | null => {
            const interestRate = row.interestRate ?? 0;

            return RATED_ACCOUNT_TYPES.has(row.type) &&
                isPositiveNumber(interestRate) &&
                facts.some(fact => fact.kind === YieldKindEnum.INTEREST)
                ? { actual: positionYield.rate, expected: interestRate / PERCENT }
                : null;
        };

        const buildPositionContext = Effect.fnUntraced(function* (row: YieldPositionRowInterface, input: YieldPositionInputInterface) {
            const instrument = { id: row.instrumentId, code: row.instrumentCode, type: row.instrumentType };
            const series = yield* yieldPriceService.loadSeries(
                instrument,
                input.baseInstrumentId,
                toYieldPriceDay(input.yieldWindowStart),
                toYieldPriceDay(input.todayDay)
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
            const context: YieldPositionContextInterface = {
                row,
                facts: input.facts,
                holdings,
                positionYield,
                latest,
                accruing: computeAccruing({ row, holdings, latest, facts: input.facts }, input.todayDay),
                vsRate: computeVsRate(row, input.facts, positionYield)
            };

            return context;
        });

        const computeCombinedYield = (
            contexts: readonly YieldPositionContextInterface[],
            excludesDistributions: boolean
        ): YieldCombinedYieldInterface => {
            const holding = contexts.filter(context => isPositiveNumber(context.positionYield.averageValue));
            const yielding = holding.filter(context => isDefined(context.positionYield.rate));
            const totalValue = sumNumbers(holding.map(context => context.positionYield.averageValue));
            const coveredValue = sumNumbers(yielding.map(context => context.positionYield.averageValue));
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
            const rewardValue = sumNumbers(yielding.map(context => annualised(context.positionYield.rewardValue, context)));
            const estimatedRewardValue = sumNumbers(
                yielding.map(context => annualised(context.positionYield.estimatedRewardValue, context))
            );
            const rate = rewardValue / coveredValue;

            return {
                ...counts,
                rate: rate > MAX_RATE ? null : rate,
                reason: rate > MAX_RATE ? YieldUnavailableReasonEnum.UNUSUALLY_HIGH : null,
                isEstimated:
                    rate <= MAX_RATE &&
                    (isShareEstimated(estimatedRewardValue, rewardValue) ||
                        isShareEstimated(sumNumbers(yielding.map(context => context.positionYield.estimatedAverageValue)), coveredValue))
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
            const total = sumNumbers(parts.map(part => part.value));

            return isPositiveNumber(total)
                ? {
                      value: total,
                      isEstimated:
                          parts.some(part => part.isPriceMissing) ||
                          isShareEstimated(sumNumbers(parts.filter(part => part.isEstimated).map(part => part.value)), total)
                  }
                : null;
        };

        return {
            loadContexts: Effect.fn('YieldHoldingService.loadContexts')(function* (
                facts: readonly YieldFactInterface[],
                scope: YieldScopeInterface,
                baseInstrumentId: number,
                todayDay: string
            ) {
                const positionIds = [...new Set(facts.map(fact => fact.positionAccountId).filter(isDefined))];
                const rows = yield* yieldRepository.findPositions(positionIds, scope);
                const movements = yield* yieldRepository.findPositionMovements(rows.map(row => row.id));
                const yieldWindowStart = formatYieldDay(subDays(parseISO(todayDay), YIELD_WINDOW_DAYS - 1));

                return yield* Effect.forEach(rows, row =>
                    buildPositionContext(row, {
                        facts: facts.filter(fact => fact.positionAccountId === row.id),
                        movements: movements.filter(movement => movement.accountId === row.id).map(toMovement),
                        baseInstrumentId,
                        todayDay,
                        yieldWindowStart
                    })
                );
            }),

            combineYield: computeCombinedYield,

            runRate: computeRunRate
        };
    })
}) {
    static readonly layer = Layer.effect(YieldHoldingService, YieldHoldingService.make).pipe(
        Layer.provide([YieldRepository.layer, YieldPriceService.layer])
    );
}
