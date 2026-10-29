import {
    BudgetAlertKindEnum,
    BudgetAlertScopeEnum,
    BudgetCategoryLimitRepository,
    BudgetPeriodSnapshotRepository,
    BudgetRepository,
    computeBudgetAlertTriggers,
    computeBudgetPaceTriggers,
    computeEffectiveLimits
} from '@budgie/budget';
import { CategoryRepository, InstrumentRepository, LanguageEnum, SettingsRepository, convertFromMicroUnits } from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Storage } from '@op-engineering/op-sqlite';
import * as EffectArray from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { postLocalNotification } from '../../@generic/utils/post-local-notification.util';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { formatSymbolAmount } from '../../i18n/utils/format-symbol-amount.util';
import { languageToLocale } from '../../i18n/utils/language-to-locale.util';
import { BUDGET_PERIOD_THIS_LABEL } from '../constant/budget-period-this-label.constant';
import { BudgetBackgroundTaskNameEnum } from '../enum/budget-background-task-name.enum';
import { resolveBudgetWindow } from '../utils/resolve-budget-window.util';

import { BudgetProjectionService } from './budget-projection.service';

import type {
    BudgetAlertTriggerInterface,
    BudgetProjectionInterface,
    BudgetProjectionScopeInterface,
    BudgetSpentInterface
} from '@budgie/budget';
import type { BudgetPeriodEnum } from '@budgie/contracts';

export class BudgetAlertMonitorService extends Context.Service<BudgetAlertMonitorService>()('@budgie/app/BudgetAlertMonitorService', {
    make: Effect.gen(function* () {
        const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
        const budgetPeriodSnapshotRepository = yield* BudgetPeriodSnapshotRepository;
        const budgetRepository = yield* BudgetRepository;
        const budgetProjectionService = yield* BudgetProjectionService;
        const categoryRepository = yield* CategoryRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const settingsRepository = yield* SettingsRepository;

        const backgroundTaskMinimumIntervalMinutes = 15;
        const storageKeyPrefix = '@budgie:budget-alerts-fired';
        const firedTriggersSchema = Schema.fromJsonString(Schema.Array(Schema.String));
        const storage = yield* Effect.acquireRelease(
            Effect.sync(() => new Storage({ name: 'budget-alerts.sqlite' })),
            budgetAlertStorage =>
                Effect.sync(() => {
                    budgetAlertStorage.closeSync();
                })
        );

        const buildStorageKey = (budgetId: number, periodStartMs: number): string => `${storageKeyPrefix}:${budgetId}:${periodStartMs}`;

        const maskedAmount = '•••';

        const buildScopeKey = (trigger: BudgetAlertTriggerInterface): string => {
            const categoryKey = isDefined(trigger.categoryId) ? trigger.categoryId : '';

            return `${trigger.scope}:${categoryKey}`;
        };

        const buildTriggerKey = (trigger: BudgetAlertTriggerInterface): string =>
            `${buildScopeKey(trigger)}:${trigger.kind === BudgetAlertKindEnum.PACE ? trigger.kind : trigger.threshold}`;

        const selectTriggersToPost = (triggers: readonly BudgetAlertTriggerInterface[], deliveredKeys: readonly string[]) => {
            const undelivered = triggers.filter(trigger => !deliveredKeys.includes(buildTriggerKey(trigger)));
            const warnedScopeKeys = new Set(
                triggers
                    .filter(trigger => trigger.kind === BudgetAlertKindEnum.WARNING && deliveredKeys.includes(buildTriggerKey(trigger)))
                    .map(buildScopeKey)
            );
            const paceTriggers = undelivered.filter(
                trigger => trigger.kind === BudgetAlertKindEnum.PACE && !warnedScopeKeys.has(buildScopeKey(trigger))
            );
            const pacedScopeKeys = new Set(paceTriggers.map(buildScopeKey));
            const isPaced = (trigger: BudgetAlertTriggerInterface): boolean =>
                pacedScopeKeys.has(buildScopeKey(trigger)) ||
                deliveredKeys.includes(buildTriggerKey({ ...trigger, kind: BudgetAlertKindEnum.PACE }));

            return [
                ...paceTriggers,
                ...undelivered.filter(
                    trigger =>
                        trigger.kind === BudgetAlertKindEnum.LIMIT || (trigger.kind === BudgetAlertKindEnum.WARNING && !isPaced(trigger))
                )
            ];
        };

        const loadDeliveredTriggerKeys = Effect.fn('BudgetAlertMonitorService.loadDeliveredTriggerKeys')(function* (storageKey: string) {
            const raw = yield* Effect.promise(() => storage.getItem(storageKey));

            if (!isDefined(raw)) {
                return [];
            }

            return Option.getOrElse(Schema.decodeUnknownOption(firedTriggersSchema)(raw), () => []);
        });

        const postOverallAlert = Effect.fn('BudgetAlertMonitorService.postOverallAlert')(function* (
            threshold: number,
            overallLimit: number,
            spentOverall: number,
            period: BudgetPeriodEnum
        ) {
            const thisPeriod = i18n._(BUDGET_PERIOD_THIS_LABEL[period]);
            const spentPercent = isPositiveNumber(overallLimit) ? Math.round((spentOverall / overallLimit) * 100) : threshold;
            const title = threshold >= 100 ? i18n._(msg`Budget limit reached`) : i18n._(msg`Overall budget: ${threshold}% spent`);
            const body = i18n._(msg`You have used ${spentPercent}% of your overall budget ${thisPeriod}.`);

            yield* postLocalNotification(title, body);
        });

        const postOtherAlert = Effect.fn('BudgetAlertMonitorService.postOtherAlert')(function* (
            threshold: number,
            period: BudgetPeriodEnum
        ) {
            const thisPeriod = i18n._(BUDGET_PERIOD_THIS_LABEL[period]);
            const title = threshold >= 100 ? i18n._(msg`Other budget: limit reached`) : i18n._(msg`Other budget: ${threshold}% spent`);
            const body = i18n._(msg`You have used ${threshold}% of your budget for spending outside category limits ${thisPeriod}.`);

            yield* postLocalNotification(title, body);
        });

        const postCategoryAlert = Effect.fn('BudgetAlertMonitorService.postCategoryAlert')(function* (
            threshold: number,
            categoryId: number,
            period: BudgetPeriodEnum
        ) {
            const thisPeriod = i18n._(BUDGET_PERIOD_THIS_LABEL[period]);
            const settings = yield* settingsRepository.findSettings();
            const language = isDefined(settings) ? settings.language : LanguageEnum.EN;
            const [category] = yield* categoryRepository.findById(categoryId, language);
            const categoryName = isDefined(category) ? category.title : i18n._(msg`Category`);
            const title =
                threshold >= 100 ? i18n._(msg`${categoryName}: limit reached`) : i18n._(msg`${categoryName}: ${threshold}% spent`);
            const body = i18n._(msg`You have used ${threshold}% of the limit for ${categoryName} ${thisPeriod}.`);

            yield* postLocalNotification(title, body);
        });

        const resolveProjectionScope = (
            projection: BudgetProjectionInterface,
            trigger: BudgetAlertTriggerInterface
        ): BudgetProjectionScopeInterface | undefined => {
            if (trigger.scope === BudgetAlertScopeEnum.OVERALL) {
                return projection.overall;
            }

            if (trigger.scope === BudgetAlertScopeEnum.OTHER) {
                return projection.other;
            }

            return projection.categories.find(category => category.categoryId === trigger.categoryId);
        };

        const postPaceAlert = Effect.fn('BudgetAlertMonitorService.postPaceAlert')(function* (
            trigger: BudgetAlertTriggerInterface,
            projection: BudgetProjectionInterface,
            instrumentId: number
        ) {
            const scope = resolveProjectionScope(projection, trigger);

            if (!isDefined(scope)) {
                return;
            }

            const settings = yield* settingsRepository.getSettings();
            const instrument = yield* instrumentRepository.findById(instrumentId);
            const locale = languageToLocale(settings.language);
            const decimalPlaces = settings.showCents ? DEFAULT_DECIMAL_PLACES : 0;
            const perDayAmount = settings.isPinEnabled
                ? maskedAmount
                : formatSymbolAmount(convertFromMicroUnits(scope.safePerDay), isDefined(instrument) ? instrument.symbol : '', absolute =>
                      new Intl.NumberFormat(locale, {
                          style: 'decimal',
                          minimumFractionDigits: decimalPlaces,
                          maximumFractionDigits: decimalPlaces
                      }).format(absolute)
                  );
            const runOutDate = isDefined(scope.runOutAt)
                ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(scope.runOutAt)
                : '';
            const [category] = isDefined(trigger.categoryId)
                ? yield* categoryRepository.findById(trigger.categoryId, settings.language)
                : [];
            const title = isDefined(category) ? category.title : i18n._(msg`Other`);
            const notificationTitle =
                trigger.scope === BudgetAlertScopeEnum.OVERALL
                    ? i18n._(msg`Your budget is ahead of pace`)
                    : i18n._(msg`${title} is ahead of pace`);
            const body = i18n._(msg`On pace to run out by ${runOutDate}. Keeping under ${perDayAmount}/day keeps it on track.`);

            yield* postLocalNotification(notificationTitle, body, {
                kind: trigger.kind,
                scope: trigger.scope,
                categoryId: trigger.categoryId
            });
        });

        const postTrigger = Effect.fn('BudgetAlertMonitorService.postTrigger')(function* (
            trigger: BudgetAlertTriggerInterface,
            overallLimit: number,
            spent: BudgetSpentInterface,
            period: BudgetPeriodEnum
        ) {
            if (trigger.scope === BudgetAlertScopeEnum.OVERALL) {
                return yield* postOverallAlert(trigger.threshold, overallLimit, spent.spentOverall, period);
            }

            if (trigger.scope === BudgetAlertScopeEnum.OTHER) {
                return yield* postOtherAlert(trigger.threshold, period);
            }

            if (isDefined(trigger.categoryId)) {
                return yield* postCategoryAlert(trigger.threshold, trigger.categoryId, period);
            }

            return yield* Effect.void;
        });

        return {
            run: Effect.fn('BudgetAlertMonitorService.run')(function* () {
                const [budget, settings] = yield* Effect.all([budgetRepository.findMain(), settingsRepository.findSettings()], {
                    concurrency: 'unbounded'
                });
                const isBudgetPushEnabled = isDefined(settings) ? settings.isBudgetPushEnabled : false;

                if (!isDefined(budget) || !isBudgetPushEnabled || !isPositiveNumber(budget.instrumentId)) {
                    return;
                }

                const now = new Date();
                const periodStartMs = resolveBudgetWindow(budget, now).periodStart.getTime();
                const spent = yield* budgetProjectionService.spent(budget, now);
                const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);
                const projection = yield* budgetProjectionService.project(budget, now);
                const [latestSnapshot] = yield* budgetPeriodSnapshotRepository.findRecent(budget.id, 1);
                const effectiveLimits = {
                    ...computeEffectiveLimits(latestSnapshot, budget, categoryLimits),
                    overallLimit: projection.overall.limit
                };
                const triggers = [
                    ...computeBudgetAlertTriggers(effectiveLimits, spent, effectiveLimits.categoryLimits),
                    ...computeBudgetPaceTriggers(projection)
                ];
                const storageKey = buildStorageKey(budget.id, periodStartMs);
                const deliveredKeys = yield* loadDeliveredTriggerKeys(storageKey);
                const newTriggers = selectTriggersToPost(triggers, deliveredKeys);
                const postedKeys = EffectArray.getSomes(
                    yield* Effect.forEach(newTriggers, trigger =>
                        (trigger.kind === BudgetAlertKindEnum.PACE
                            ? postPaceAlert(trigger, projection, budget.instrumentId)
                            : postTrigger(trigger, effectiveLimits.overallLimit, spent, budget.period)
                        ).pipe(Effect.as(buildTriggerKey(trigger)), Effect.option)
                    )
                );

                if (isNotEmptyArray(postedKeys)) {
                    yield* Effect.promise(() => storage.setItem(storageKey, JSON.stringify([...deliveredKeys, ...postedKeys])));
                }
            }),
            registerBackgroundTask: Effect.fn('BudgetAlertMonitorService.registerBackgroundTask')(function* () {
                const options = yield* Effect.promise(() =>
                    TaskManager.getTaskOptionsAsync<BackgroundTask.BackgroundTaskOptions | null>(BudgetBackgroundTaskNameEnum.ALERT_MONITOR)
                );

                if (options?.minimumInterval === backgroundTaskMinimumIntervalMinutes) {
                    return;
                }

                if (isDefined(options)) {
                    yield* Effect.promise(() => BackgroundTask.unregisterTaskAsync(BudgetBackgroundTaskNameEnum.ALERT_MONITOR));
                }

                yield* Effect.promise(() =>
                    BackgroundTask.registerTaskAsync(BudgetBackgroundTaskNameEnum.ALERT_MONITOR, {
                        minimumInterval: backgroundTaskMinimumIntervalMinutes
                    })
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetAlertMonitorService, BudgetAlertMonitorService.make).pipe(
        Layer.provide([
            BudgetCategoryLimitRepository.layer,
            BudgetPeriodSnapshotRepository.layer,
            BudgetProjectionService.layer,
            BudgetRepository.layer,
            CategoryRepository.layer,
            InstrumentRepository.layer,
            SettingsRepository.layer
        ])
    );
}
