import {
    Db,
    RecurringMatchSourceEnum,
    RecurringSeriesKindEnum,
    RecurringSeriesSourceEnum,
    RecurringSeriesStatusEnum,
    RecurringSeriesUserStateEnum,
    SettingsRepository
} from '@budgie/contracts';
import { startOfDay } from 'date-fns/startOfDay';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { RecurringSeriesNotFoundError } from '../error/recurring-series-not-found.error';
import { RecurringTransactionNotFoundError } from '../error/recurring-transaction-not-found.error';
import { RecurringRepository } from '../repository/recurring.repository';
import { isCycleCovered, resolveRecurringAlert, resolveRecurringPriceChange } from '../series/recurring-alert';
import { merchantIdentityOf } from '../series/recurring-matcher';
import { projectRecurringMonth } from '../series/recurring-projection';
import { cadencePeriodDays, monthlyEquivalent, nearestCycleDate, nextOccurrences } from '../series/recurring-schedule';
import { counterpartyKey, description, identity } from '../series/recurring-series';
import { isSeriesActiveNow } from '../series/recurring-state';
import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import { RecurringRefreshService } from './recurring-refresh.service';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringManualInputInterface } from '../interface/recurring-manual-input.interface';
import type { RecurringReadModelInterface } from '../interface/recurring-read-model.interface';
import type { RecurringRemovalInterface } from '../interface/recurring-removal.interface';
import type { RecurringSeriesDetailInterface } from '../interface/recurring-series-detail.interface';
import type { RecurringSeriesListItemInterface } from '../interface/recurring-series-list-item.interface';
import type { RecurringUpdateInputInterface } from '../interface/recurring-update-input.interface';
import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

const TRACKED_KINDS = [RecurringSeriesKindEnum.EXPENSE, RecurringSeriesKindEnum.INCOME] as const;
const NEXT_DATES_COUNT = 3;
const NEXT_DATES_LOOKAHEAD = 24;
const FITTING_AMOUNT_RATIO = 0.1;

const chargeKey = (kind: RecurringSeriesKindEnum, transactionId: number): string => `${kind}:${transactionId}`;

export class RecurringService extends Context.Service<RecurringService>()('@budgie/recurring/RecurringService', {
    make: Effect.gen(function* () {
        const recurringRepository = yield* RecurringRepository;
        const settingsRepository = yield* SettingsRepository;
        const refreshService = yield* RecurringRefreshService;

        const loadModels = Effect.fnUntraced(function* () {
            const { defaultInstrumentId, language } = yield* settingsRepository.getSettings();
            const rows = yield* recurringRepository.findSeriesRows(defaultInstrumentId, language);
            const links = yield* recurringRepository.findLinks();
            const charges = (yield* Effect.forEach(TRACKED_KINDS, kind =>
                recurringRepository.findLinkedCharges(defaultInstrumentId, language, kind)
            )).flat();
            const chargeByKey = new Map(charges.map(charge => [chargeKey(charge.kind, charge.transactionId), charge]));
            const models: RecurringReadModelInterface[] = rows.map(series => ({
                series: { ...series, defaultAmount: Math.round(series.defaultAmount) },
                links: links
                    .filter(link => link.seriesId === series.id)
                    .flatMap(link => {
                        const charge = chargeByKey.get(chargeKey(series.kind, link.transactionId));

                        return isDefined(charge) ? [{ link, charge }] : [];
                    })
            }));

            return { models, defaultInstrumentId, language };
        });

        const loadReadyModels = Effect.fnUntraced(function* (now: Date) {
            yield* refreshService.ensureInitial(now);

            return yield* loadModels();
        });

        const upcomingDates = (model: RecurringReadModelInterface, now: Date, count: number): Date[] =>
            nextOccurrences(model.series, now, NEXT_DATES_LOOKAHEAD)
                .filter(date => !isCycleCovered(model, date))
                .slice(0, count);

        const toListItem = (
            model: RecurringReadModelInterface,
            defaultInstrumentId: number | null,
            now: Date
        ): RecurringSeriesListItemInterface => {
            const { series } = model;
            const isActive = isSeriesActiveNow(series, now);

            return {
                id: series.id,
                title: series.title,
                kind: series.kind,
                source: series.source,
                userState: series.userState,
                isActive,
                confidence: series.confidence,
                cadenceUnit: series.cadenceUnit,
                cadenceInterval: series.cadenceInterval,
                nextDate: isActive ? (upcomingDates(model, now, 1)[0] ?? null) : null,
                amount: series.defaultAmount,
                nativeAmount: series.amount,
                monthlyEquivalent: Math.round(monthlyEquivalent({ ...series, amount: series.defaultAmount })),
                alert: resolveRecurringAlert(model, now),
                priceChange: resolveRecurringPriceChange(model, now),
                categoryId: series.categoryId,
                categoryTitle: series.categoryTitle,
                categoryIcon: series.categoryIcon,
                accountId: series.accountId,
                instrumentId: series.instrumentId ?? defaultInstrumentId,
                endsAt: series.endsAt,
                reminderDaysBefore: series.reminderDaysBefore,
                linkedCount: model.links.filter(({ link }) => !link.isExcluded).length
            };
        };

        const requireSeries = Effect.fnUntraced(function* (seriesId: number) {
            const series = yield* recurringRepository.findSeriesById(seriesId);

            return isDefined(series) ? series : yield* new RecurringSeriesNotFoundError({ seriesId });
        });

        const findCharge = Effect.fnUntraced(function* (transactionId: number, kinds: readonly RecurringSeriesKindEnum[]) {
            const { defaultInstrumentId, language } = yield* settingsRepository.getSettings();
            const charges = yield* Effect.forEach(kinds, kind =>
                recurringRepository.findChargeByTransactionId(defaultInstrumentId, language, kind, transactionId)
            );
            const charge = charges.find(isDefined);

            return isDefined(charge) ? charge : yield* new RecurringTransactionNotFoundError({ transactionId });
        });

        const attachTransaction = Effect.fnUntraced(function* (series: RecurringSeriesEntityInterface, charge: RecurringChargeInterface) {
            const liveLinks = yield* recurringRepository.findLinksByTransactionId(charge.transactionId);
            yield* Effect.forEach(
                liveLinks.filter(link => link.seriesId !== series.id && !link.isExcluded),
                link => recurringRepository.updateLink(link.id, { isExcluded: true, matchedBy: RecurringMatchSourceEnum.USER }),
                { discard: true }
            );
            const { cycleDate } = nearestCycleDate(series, startOfDay(charge.operatedAt));
            const existing = yield* recurringRepository.findLinkByPair(series.id, charge.transactionId);
            const link = isDefined(existing)
                ? yield* recurringRepository.updateLink(existing.id, {
                      isExcluded: false,
                      matchedBy: RecurringMatchSourceEnum.USER,
                      deletedAt: null,
                      cycleDate
                  })
                : yield* recurringRepository.insertLink({
                      seriesId: series.id,
                      transactionId: charge.transactionId,
                      cycleDate,
                      matchedBy: RecurringMatchSourceEnum.USER
                  });
            const chargeIdentity = identity(charge);
            const isSeenLater =
                series.source === RecurringSeriesSourceEnum.DETECTED && charge.operatedAt.getTime() > series.lastSeenAt.getTime();
            const needsMerchantKey = !isNotEmptyString(series.merchantKey) && isNotEmptyString(chargeIdentity);
            if (needsMerchantKey || isSeenLater) {
                yield* recurringRepository.updateSeries(series.id, {
                    ...(needsMerchantKey && { merchantKey: chargeIdentity }),
                    ...(isSeenLater && { lastSeenAt: charge.operatedAt })
                });
            }

            return link;
        });

        const createManualSeries = (input: RecurringManualInputInterface, merchantKey: string) =>
            recurringRepository.createSeries({
                merchantKey,
                kind: input.kind,
                periodDays: Math.round(cadencePeriodDays(input)),
                amount: input.amount,
                status: RecurringSeriesStatusEnum.ACTIVE,
                userState: RecurringSeriesUserStateEnum.CONFIRMED,
                title: input.title,
                categoryId: input.categoryId ?? null,
                lastSeenAt: input.anchorDate,
                source: RecurringSeriesSourceEnum.MANUAL,
                accountId: input.accountId ?? null,
                cadenceUnit: input.cadenceUnit,
                cadenceInterval: input.cadenceInterval,
                anchorDate: input.anchorDate,
                instrumentId: input.instrumentId,
                endsAt: input.endsAt ?? null,
                reminderDaysBefore: input.reminderDaysBefore ?? null,
                confidence: 100
            });

        const setUserState = (seriesId: number, userState: RecurringSeriesUserStateEnum) =>
            recurringRepository.updateSeries(seriesId, { userState });

        return {
            calendar: Effect.fn('RecurringService.calendar')(function* (year: number, month: number, now: Date) {
                const { models } = yield* loadReadyModels(now);

                return projectRecurringMonth(models, year, month, now, RecurringSeriesKindEnum.EXPENSE);
            }),
            incomeCalendar: Effect.fn('RecurringService.incomeCalendar')(function* (year: number, month: number, now: Date) {
                const { models } = yield* loadReadyModels(now);

                return projectRecurringMonth(models, year, month, now, RecurringSeriesKindEnum.INCOME);
            }),
            listSeries: Effect.fn('RecurringService.listSeries')(function* (now: Date) {
                const { models, defaultInstrumentId } = yield* loadReadyModels(now);

                return models
                    .filter(({ series }) => series.userState !== RecurringSeriesUserStateEnum.DISMISSED)
                    .map(model => toListItem(model, defaultInstrumentId, now));
            }),
            getSeriesDetail: Effect.fn('RecurringService.getSeriesDetail')(function* (seriesId: number, now: Date) {
                const { models, defaultInstrumentId } = yield* loadReadyModels(now);
                const model = models.find(({ series }) => series.id === seriesId);

                if (!isDefined(model)) {
                    return yield* new RecurringSeriesNotFoundError({ seriesId });
                }
                const detail: RecurringSeriesDetailInterface = {
                    series: toListItem(model, defaultInstrumentId, now),
                    nextDates: upcomingDates(model, now, NEXT_DATES_COUNT),
                    history: [...model.links]
                        .sort((first, second) => second.charge.operatedAt.getTime() - first.charge.operatedAt.getTime())
                        .map(({ link, charge }) => ({
                            transactionId: charge.transactionId,
                            operatedAt: charge.operatedAt,
                            amount: Math.round(charge.defaultAmount),
                            nativeAmount: charge.nativeAmount,
                            instrumentId: charge.instrumentId,
                            isExcluded: link.isExcluded,
                            matchedBy: link.matchedBy
                        }))
                };

                return detail;
            }),
            createManual: Effect.fn('RecurringService.createManual')(function* (input: RecurringManualInputInterface) {
                return yield* createManualSeries(input, '');
            }),
            update: Effect.fn('RecurringService.update')(function* (seriesId: number, patch: RecurringUpdateInputInterface) {
                const series = yield* requireSeries(seriesId);
                const hasCadencePatch = isDefined(patch.cadenceUnit) || isDefined(patch.cadenceInterval);

                return yield* recurringRepository.updateSeries(seriesId, {
                    ...patch,
                    ...(hasCadencePatch && {
                        periodDays: Math.round(
                            cadencePeriodDays({
                                cadenceUnit: patch.cadenceUnit ?? series.cadenceUnit,
                                cadenceInterval: patch.cadenceInterval ?? series.cadenceInterval
                            })
                        )
                    }),
                    ...(series.source === RecurringSeriesSourceEnum.DETECTED && { userState: RecurringSeriesUserStateEnum.CONFIRMED })
                });
            }),
            confirm: Effect.fn('RecurringService.confirm')(function* (seriesId: number) {
                yield* requireSeries(seriesId);

                return yield* setUserState(seriesId, RecurringSeriesUserStateEnum.CONFIRMED);
            }),
            dismiss: Effect.fn('RecurringService.dismiss')(function* (seriesId: number) {
                yield* requireSeries(seriesId);

                return yield* setUserState(seriesId, RecurringSeriesUserStateEnum.DISMISSED);
            }),
            undismiss: Effect.fn('RecurringService.undismiss')(function* (seriesId: number) {
                yield* requireSeries(seriesId);

                return yield* setUserState(seriesId, RecurringSeriesUserStateEnum.SUGGESTED);
            }),
            remove: Effect.fn('RecurringService.remove')(function* (seriesId: number) {
                const series = yield* requireSeries(seriesId);
                const removal: RecurringRemovalInterface = { seriesId, source: series.source };

                if (series.source === RecurringSeriesSourceEnum.DETECTED) {
                    yield* setUserState(seriesId, RecurringSeriesUserStateEnum.DISMISSED);

                    return removal;
                }
                const deletedAt = new Date();
                yield* Db.transaction(
                    Effect.gen(function* () {
                        const links = (yield* recurringRepository.findLinks()).filter(link => link.seriesId === seriesId);
                        yield* recurringRepository.setLinksDeletedAt(
                            links.map(link => link.id),
                            deletedAt
                        );
                        yield* recurringRepository.setSeriesDeletedAt(seriesId, deletedAt);
                    })
                );

                return removal;
            }),
            restore: Effect.fn('RecurringService.restore')(function* (seriesId: number) {
                const series = yield* requireSeries(seriesId);

                if (!isDefined(series.deletedAt)) {
                    return series;
                }
                const { deletedAt } = series;

                return yield* Db.transaction(
                    Effect.gen(function* () {
                        const liveTransactions = new Set(
                            (yield* recurringRepository.findLinks()).filter(link => !link.isExcluded).map(link => link.transactionId)
                        );
                        const links = yield* recurringRepository.findLinksDeletedAt(seriesId, deletedAt);
                        yield* recurringRepository.setLinksDeletedAt(
                            links.filter(link => link.isExcluded || !liveTransactions.has(link.transactionId)).map(link => link.id),
                            null
                        );

                        return yield* recurringRepository.setSeriesDeletedAt(seriesId, null);
                    })
                );
            }),
            excludeTransaction: Effect.fn('RecurringService.excludeTransaction')(function* (seriesId: number, transactionId: number) {
                const series = yield* requireSeries(seriesId);
                const existing = yield* recurringRepository.findLinkByPair(seriesId, transactionId);

                if (isDefined(existing)) {
                    return yield* recurringRepository.updateLink(existing.id, {
                        isExcluded: true,
                        matchedBy: RecurringMatchSourceEnum.USER,
                        deletedAt: null
                    });
                }
                const charge = yield* Effect.option(findCharge(transactionId, [series.kind]));
                const cycleDate = Option.isSome(charge) ? startOfDay(charge.value.operatedAt) : series.anchorDate;

                return yield* recurringRepository.insertLink({
                    seriesId,
                    transactionId,
                    cycleDate,
                    matchedBy: RecurringMatchSourceEnum.USER,
                    isExcluded: true
                });
            }),
            addTransaction: Effect.fn('RecurringService.addTransaction')(function* (seriesId: number, transactionId: number) {
                const series = yield* requireSeries(seriesId);
                const charge = yield* findCharge(transactionId, [series.kind]);

                return yield* Db.transaction(attachTransaction(series, charge));
            }),
            seriesForTransaction: Effect.fn('RecurringService.seriesForTransaction')(function* (transactionId: number) {
                const links = yield* recurringRepository.findLinksByTransactionId(transactionId);
                const link = links.find(item => !item.isExcluded);

                if (!isDefined(link)) {
                    return null;
                }
                const series = yield* recurringRepository.findSeriesById(link.seriesId);

                return isDefined(series) && !isDefined(series.deletedAt) ? series : null;
            }),
            fittingSeries: Effect.fn('RecurringService.fittingSeries')(function* (transactionId: number, now: Date) {
                const charge = yield* findCharge(transactionId, TRACKED_KINDS);
                const { models, defaultInstrumentId } = yield* loadModels();
                const chargeIdentity = identity(charge);
                const normalizedDescription = normalizeRecurringDescription(description(charge));

                return models
                    .filter(
                        ({ series, links }) =>
                            series.kind === charge.kind &&
                            series.userState !== RecurringSeriesUserStateEnum.DISMISSED &&
                            !links.some(({ link }) => !link.isExcluded && link.transactionId === transactionId)
                    )
                    .map(model => {
                        const title = normalizeRecurringDescription(model.series.title);
                        const isMerchant = isNotEmptyString(model.series.merchantKey)
                            ? isNotEmptyString(chargeIdentity) && merchantIdentityOf(model.series.merchantKey) === chargeIdentity
                            : isNotEmptyString(title) && normalizedDescription.includes(title);
                        const gap = Math.abs(model.series.defaultAmount - charge.defaultAmount);

                        return { model, isMerchant, gap, isCloseAmount: gap <= model.series.defaultAmount * FITTING_AMOUNT_RATIO };
                    })
                    .filter(({ isMerchant, isCloseAmount }) => isMerchant || isCloseAmount)
                    .sort((first, second) => Number(second.isMerchant) - Number(first.isMerchant) || first.gap - second.gap)
                    .map(({ model }) => toListItem(model, defaultInstrumentId, now));
            }),
            makeRecurringFromTransaction: Effect.fn('RecurringService.makeRecurringFromTransaction')(function* (
                transactionId: number,
                input: RecurringManualInputInterface
            ) {
                const charge = yield* findCharge(transactionId, [input.kind]);

                return yield* Db.transaction(
                    Effect.gen(function* () {
                        const links = yield* recurringRepository.findLinks();
                        const dismissed = (yield* recurringRepository.findAllSeries()).filter(
                            series =>
                                series.source === RecurringSeriesSourceEnum.DETECTED &&
                                series.userState === RecurringSeriesUserStateEnum.DISMISSED &&
                                series.kind === input.kind
                        );
                        const counterparty = counterpartyKey(charge);
                        const revivable = dismissed.find(
                            series =>
                                links.some(link => link.seriesId === series.id && link.transactionId === transactionId) ||
                                (isNotEmptyString(counterparty) && series.merchantKey.split('|')[2] === counterparty)
                        );
                        const series = isDefined(revivable)
                            ? yield* recurringRepository.updateSeries(revivable.id, {
                                  userState: RecurringSeriesUserStateEnum.CONFIRMED,
                                  status: RecurringSeriesStatusEnum.ACTIVE,
                                  title: input.title,
                                  amount: input.amount,
                                  instrumentId: input.instrumentId,
                                  categoryId: input.categoryId ?? null,
                                  accountId: input.accountId ?? null,
                                  cadenceUnit: input.cadenceUnit,
                                  cadenceInterval: input.cadenceInterval,
                                  anchorDate: input.anchorDate,
                                  periodDays: Math.round(cadencePeriodDays(input)),
                                  endsAt: input.endsAt ?? null,
                                  reminderDaysBefore: input.reminderDaysBefore ?? null
                              })
                            : yield* createManualSeries(input, identity(charge));
                        yield* attachTransaction(series, charge);

                        return yield* requireSeries(series.id);
                    })
                );
            }),
            setUserState,
            rename: (seriesId: number, title: string) => recurringRepository.updateSeries(seriesId, { title })
        };
    })
}) {
    static readonly layer = Layer.effect(RecurringService, RecurringService.make).pipe(
        Layer.provide([RecurringRepository.layer, SettingsRepository.layer, RecurringRefreshService.layer])
    );
}
